import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// Storage prefix for local offline fallback
const LOCAL_PREFIX = 'dofu_data_';

export const getLocalCollection = (collectionName) => {
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFIX}${collectionName}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Error reading local collection ${collectionName}`, e);
    return [];
  }
};

export const setLocalCollection = (collectionName, items) => {
  try {
    localStorage.setItem(`${LOCAL_PREFIX}${collectionName}`, JSON.stringify(items));
  } catch (e) {
    console.error(`Error saving local collection ${collectionName}`, e);
  }
};

/**
 * Realtime collection subscription
 * If Firestore is available, listens via onSnapshot.
 * Also emits local collection immediately and listens to both cross-tab storage
 * and same-tab custom events for instant, 100% reliable UI reactivity.
 */
export const subscribeToCollection = (collectionName, onData, onError) => {
  let unsubFirestore = null;

  const emitLocal = () => {
    try {
      const items = getLocalCollection(collectionName);
      onData(items);
    } catch (e) {
      console.warn(`Error reading local collection ${collectionName}`, e);
    }
  };

  if (db) {
    try {
      const colRef = collection(db, collectionName);
      unsubFirestore = onSnapshot(
        colRef,
        (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            // normalize timestamps
            createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
            updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt,
          }));
          // Merge with any pending local records so in-flight saves are never wiped
          const localItems = getLocalCollection(collectionName);
          const unSyncedLocals = localItems.filter((loc) => !items.some((rem) => rem.id === loc.id));
          const merged = [...unSyncedLocals, ...items];
          setLocalCollection(collectionName, merged);
          onData(merged);
        },
        (err) => {
          console.warn(`Firestore subscription fallback for ${collectionName}:`, err.message);
          if (onError) onError(err);
          // Fallback to local mirror
          emitLocal();
        }
      );
    } catch (e) {
      console.warn(`Failed to attach Firestore snapshot for ${collectionName}`, e);
    }
  }

  // Always emit local data immediately so UI renders instantaneously without delay
  emitLocal();

  // Listen for cross-tab storage changes
  const storageHandler = (e) => {
    if (e.key === `${LOCAL_PREFIX}${collectionName}`) {
      emitLocal();
    }
  };
  // Listen for same-tab custom events dispatched on add/update/delete
  const customHandler = () => {
    emitLocal();
  };

  window.addEventListener('storage', storageHandler);
  window.addEventListener(`dofu_update_${collectionName}`, customHandler);

  return () => {
    if (typeof unsubFirestore === 'function') unsubFirestore();
    window.removeEventListener('storage', storageHandler);
    window.removeEventListener(`dofu_update_${collectionName}`, customHandler);
  };
};

// Helper to recursively sanitize payloads for Firestore (removes undefined & NaN)
export const cleanForFirestore = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item));
  }
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    if (typeof val === 'number' && isNaN(val)) {
      clean[key] = 0;
    } else if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      clean[key] = cleanForFirestore(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

/**
 * Add a new record to collection
 * Instant Optimistic Execution:
 * 1. Generates Firestore document ID synchronously in-memory (0ms network cost)
 * 2. Saves to localStorage and emits local reactivity events immediately (<1ms)
 * 3. Kicks off Firestore cloud synchronization in background without holding up the user interface
 */
export const createRecord = async (collectionName, data) => {
  const timestamp = new Date().toISOString();
  let id = data.id;
  let docRef = null;

  if (db) {
    try {
      const colRef = collection(db, collectionName);
      docRef = id ? doc(db, collectionName, id) : doc(colRef);
      id = docRef.id;
    } catch (e) {
      console.warn(`Error generating Firestore docRef for ${collectionName}:`, e);
    }
  }

  if (!id) {
    id = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  const newRecord = {
    ...data,
    id,
    createdAt: data.createdAt || timestamp,
    updatedAt: timestamp
  };

  // 1. Instant local persistence & reactivity (<1ms, ZERO DELAY)
  const items = getLocalCollection(collectionName);
  const updatedItems = [newRecord, ...items.filter((i) => i.id !== id)];
  setLocalCollection(collectionName, updatedItems);
  window.dispatchEvent(new Event(`dofu_update_${collectionName}`));

  // 2. Background Firestore write (does NOT block UI or network wait)
  if (db && docRef) {
    const firestorePayload = cleanForFirestore({
      ...newRecord,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setDoc(docRef, firestorePayload, { merge: true }).catch((err) => {
      console.warn(`Background Firestore write for ${collectionName}/${id}:`, err);
    });
  }

  return newRecord;
};

/**
 * Update an existing record
 * Instant Optimistic Execution:
 * 1. Updates localStorage and dispatches change event immediately (0ms)
 * 2. Syncs to Firestore in background without blocking caller UI
 */
export const updateRecord = async (collectionName, id, updates) => {
  const timestamp = new Date().toISOString();
  const cleanUpdates = {
    ...updates,
    updatedAt: timestamp
  };

  // 1. Instant local update & reactivity (<1ms, ZERO DELAY)
  const items = getLocalCollection(collectionName);
  let updatedRecord = { id, ...cleanUpdates };
  const updatedItems = items.map((item) => {
    if (item.id === id) {
      updatedRecord = { ...item, ...cleanUpdates };
      return updatedRecord;
    }
    return item;
  });
  setLocalCollection(collectionName, updatedItems);
  window.dispatchEvent(new Event(`dofu_update_${collectionName}`));

  // 2. Background Firestore update (does NOT block caller UI)
  if (db && !id.startsWith('loc_')) {
    try {
      const docRef = doc(db, collectionName, id);
      const firestorePayload = cleanForFirestore({
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });
      setDoc(docRef, firestorePayload, { merge: true }).catch((err) => {
        console.warn(`Background Firestore update for ${collectionName}/${id}:`, err);
      });
    } catch (e) {
      console.warn(`Error updating Firestore doc ${collectionName}/${id}:`, e);
    }
  }

  return updatedRecord;
};

/**
 * Delete a record
 * Instant Optimistic Execution
 */
export const deleteRecord = async (collectionName, id) => {
  // 1. Instant local delete (<1ms)
  const items = getLocalCollection(collectionName);
  const filtered = items.filter((item) => item.id !== id);
  setLocalCollection(collectionName, filtered);
  window.dispatchEvent(new Event(`dofu_update_${collectionName}`));

  // 2. Background Firestore delete (does NOT block caller UI)
  if (db && !id.startsWith('loc_')) {
    try {
      const docRef = doc(db, collectionName, id);
      deleteDoc(docRef).catch((err) => {
        console.warn(`Background Firestore delete for ${collectionName}/${id}:`, err);
      });
    } catch (e) {
      console.warn(`Error deleting Firestore doc ${collectionName}/${id}:`, e);
    }
  }

  return true;
};

/**
 * Sync all local records up to Firestore
 */
export const syncAllLocalToFirestore = async (collectionsList) => {
  if (!db) {
    throw new Error('Firestore is not connected yet. Please configure your Firebase credentials.');
  }

  let totalSynced = 0;
  for (const col of collectionsList) {
    const localItems = getLocalCollection(col);
    if (!localItems || localItems.length === 0) continue;

    for (const item of localItems) {
      try {
        const { id, ...payload } = item;
        // If it was locally generated, write as new or with same ID
        const docRef = doc(db, col, id);
        await setDoc(docRef, {
          ...payload,
          syncedAt: serverTimestamp()
        }, { merge: true });
        totalSynced++;
      } catch (e) {
        console.error(`Sync error on item in ${col}`, e);
      }
    }
  }
  return totalSynced;
};

/**
 * Clear all system data across collections
 */
export const clearAllCollections = async (
  collectionsList = ['clients', 'orders', 'projects', 'inventory', 'invoices', 'sales', 'expenses', 'notes']
) => {
  for (const col of collectionsList) {
    try {
      localStorage.removeItem(`${LOCAL_PREFIX}${col}`);
      localStorage.setItem(`${LOCAL_PREFIX}${col}`, JSON.stringify([]));
      window.dispatchEvent(new Event(`dofu_update_${col}`));
    } catch (e) {
      console.warn(`Error clearing local collection ${col}`, e);
    }

    if (db) {
      try {
        const colRef = collection(db, col);
        const snapshot = await getDocs(colRef);
        const deletes = snapshot.docs.map((d) => deleteDoc(doc(db, col, d.id)));
        await Promise.all(deletes);
      } catch (err) {
        console.warn(`Firestore clear error on collection ${col}:`, err);
      }
    }
  }
};

