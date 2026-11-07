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
          // Save a mirror locally for offline reliability
          setLocalCollection(collectionName, items);
          onData(items);
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

/**
 * Add a new record to collection
 */
export const createRecord = async (collectionName, data) => {
  const timestamp = new Date().toISOString();
  const newRecord = {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  if (db) {
    try {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, {
        ...newRecord,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const saved = { id: docRef.id, ...newRecord };
      const items = getLocalCollection(collectionName);
      setLocalCollection(collectionName, [saved, ...items.filter((i) => i.id !== saved.id)]);
      window.dispatchEvent(new Event(`dofu_update_${collectionName}`));
      return saved;
    } catch (err) {
      console.warn(`Firestore write failed for ${collectionName}, falling back to local:`, err);
    }
  }

  // Local storage write
  const id = `loc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const itemWithId = { id, ...newRecord };
  const items = getLocalCollection(collectionName);
  const updated = [itemWithId, ...items];
  setLocalCollection(collectionName, updated);

  // Dispatch custom event for same-tab reactivity
  window.dispatchEvent(new Event(`dofu_update_${collectionName}`));
  return itemWithId;
};

/**
 * Update an existing record
 */
export const updateRecord = async (collectionName, id, updates) => {
  const timestamp = new Date().toISOString();
  const cleanUpdates = {
    ...updates,
    updatedAt: timestamp
  };

  if (db) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
      });
      const items = getLocalCollection(collectionName);
      const updated = items.map((item) => (item.id === id ? { ...item, ...cleanUpdates } : item));
      setLocalCollection(collectionName, updated);
      window.dispatchEvent(new Event(`dofu_update_${collectionName}`));
      return { id, ...cleanUpdates };
    } catch (err) {
      console.warn(`Firestore update failed for ${collectionName}/${id}:`, err);
    }
  }

  // Local update
  const items = getLocalCollection(collectionName);
  const updated = items.map((item) => (item.id === id ? { ...item, ...cleanUpdates } : item));
  setLocalCollection(collectionName, updated);
  window.dispatchEvent(new Event(`dofu_update_${collectionName}`));
  return { id, ...cleanUpdates };
};

/**
 * Delete a record
 */
export const deleteRecord = async (collectionName, id) => {
  if (db) {
    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
      const items = getLocalCollection(collectionName);
      const filtered = items.filter((item) => item.id !== id);
      setLocalCollection(collectionName, filtered);
      window.dispatchEvent(new Event(`dofu_update_${collectionName}`));
      return true;
    } catch (err) {
      console.warn(`Firestore delete failed for ${collectionName}/${id}:`, err);
    }
  }

  // Local delete
  const items = getLocalCollection(collectionName);
  const filtered = items.filter((item) => item.id !== id);
  setLocalCollection(collectionName, filtered);
  window.dispatchEvent(new Event(`dofu_update_${collectionName}`));
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

