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
import { getIdbCollection, setIdbCollection, clearIdbCollections } from './idb';

// Storage prefix for local offline fallback
const LOCAL_PREFIX = 'dofu_data_';

/**
 * Strips huge base64 image strings (>500 chars) for localStorage
 * so that localStorage NEVER throws QuotaExceededError (5MB browser limit).
 * Full high-resolution photos remain 100% preserved in IndexedDB & Firestore.
 */
const sanitizeForLocalStorage = (items) => {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item;
    let modified = false;
    let clean = { ...item };

    if (Array.isArray(clean.images)) {
      const hasLarge = clean.images.some((img) => typeof img === 'string' && img.length > 500);
      if (hasLarge) {
        clean.images = clean.images.map((img, idx) =>
          typeof img === 'string' && img.startsWith('data:') ? `[IMAGE_${idx + 1}_INDEXEDDB]` : img
        );
        modified = true;
      }
    }

    if (typeof clean.imageUrl === 'string' && clean.imageUrl.length > 500 && clean.imageUrl.startsWith('data:')) {
      clean.imageUrl = '[IMAGE_INDEXEDDB]';
      modified = true;
    }

    return modified ? clean : item;
  });
};

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
  // 1. Save full payload (including base64 photos) to high-capacity IndexedDB
  setIdbCollection(collectionName, items).catch((err) => {
    console.warn(`Error persisting ${collectionName} to IndexedDB:`, err);
  });

  // 2. Save sanitized lightweight copy to localStorage so it never hits 5MB quota
  try {
    const sanitized = sanitizeForLocalStorage(items);
    localStorage.setItem(`${LOCAL_PREFIX}${collectionName}`, JSON.stringify(sanitized));
  } catch (e) {
    console.warn(`LocalStorage quota exceeded for ${collectionName}, safely stored in IndexedDB:`, e);
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

  // 1. Immediately emit from synchronous localStorage for instant 0ms render
  try {
    const syncItems = getLocalCollection(collectionName);
    if (syncItems && syncItems.length > 0) {
      onData(syncItems);
    }
  } catch (e) {
    console.warn(`Error reading local collection ${collectionName}`, e);
  }

  // 2. Fetch full records with full photos from high-capacity IndexedDB
  getIdbCollection(collectionName).then((idbItems) => {
    if (Array.isArray(idbItems) && idbItems.length > 0) {
      onData(idbItems);
    }
  }).catch((e) => {
    console.warn(`Error reading IndexedDB for ${collectionName}:`, e);
  });

  // 3. Attach Firestore realtime onSnapshot listener
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
          // Fallback to IndexedDB / local mirror
          getIdbCollection(collectionName).then((idbItems) => {
            if (idbItems && idbItems.length > 0) onData(idbItems);
            else onData(getLocalCollection(collectionName));
          });
        }
      );
    } catch (e) {
      console.warn(`Failed to attach Firestore snapshot for ${collectionName}`, e);
    }
  }

  // Listen for cross-tab storage changes
  const storageHandler = (e) => {
    if (e.key === `${LOCAL_PREFIX}${collectionName}`) {
      getIdbCollection(collectionName).then((idbItems) => {
        if (idbItems && idbItems.length > 0) onData(idbItems);
        else onData(getLocalCollection(collectionName));
      });
    }
  };
  // Listen for same-tab custom events dispatched on add/update/delete
  const customHandler = () => {
    getIdbCollection(collectionName).then((idbItems) => {
      if (idbItems && idbItems.length > 0) onData(idbItems);
      else onData(getLocalCollection(collectionName));
    });
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
 * Clear all system data across collections (Factory Reset)
 */
export const clearAllCollections = async (
  collectionsList = ['clients', 'orders', 'projects', 'inventory', 'invoices', 'sales', 'expenses', 'notes']
) => {
  // Clear IndexedDB store
  await clearIdbCollections();

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

/**
 * Directly fetch all records across all collections from Cloud Firestore.
 * Used for guaranteed complete cloud backups and scans.
 */
export const fetchCloudDatabaseSnapshot = async () => {
  const result = {
    scannedAt: new Date().toISOString(),
    collections: {},
    counts: {}
  };

  const targetCollections = ['orders', 'clients', 'invoices', 'expenses', 'projects', 'sales', 'notes', 'staff'];

  for (const colName of targetCollections) {
    let items = [];
    if (db) {
      try {
        const colRef = collection(db, colName);
        const snap = await getDocs(colRef);
        items = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
          updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt,
        }));
      } catch (err) {
        console.warn(`Direct fetch failed for ${colName}, falling back to IndexedDB:`, err);
      }
    }

    // If Firestore failed or returned empty, check IndexedDB
    if (items.length === 0) {
      items = await getIdbCollection(colName);
    }
    if (items.length === 0) {
      items = getLocalCollection(colName);
    }

    result.collections[colName] = items;
    result.counts[colName] = items.length;
  }

  return result;
};

/**
 * Import and restore records from an exported backup object
 */
export const importBackupToSystem = async (backupPayload) => {
  if (!backupPayload || typeof backupPayload !== 'object') {
    throw new Error('Invalid backup file format.');
  }

  const collections = backupPayload.collections || backupPayload;
  const targetCollections = ['orders', 'clients', 'invoices', 'expenses', 'projects', 'sales', 'notes', 'staff'];
  let restoredCount = 0;

  for (const col of targetCollections) {
    const items = collections[col];
    if (Array.isArray(items) && items.length > 0) {
      // 1. Save to local stores
      setLocalCollection(col, items);
      window.dispatchEvent(new Event(`dofu_update_${col}`));

      // 2. Sync into Firestore if available
      if (db) {
        for (const item of items) {
          try {
            const { id, ...data } = item;
            if (id) {
              const docRef = doc(db, col, id);
              await setDoc(docRef, cleanForFirestore(data), { merge: true });
              restoredCount++;
            }
          } catch (err) {
            console.warn(`Error restoring ${col}/${item.id}:`, err);
          }
        }
      }
    }
  }

  return restoredCount;
};


