// High-Capacity Offline Storage via Native IndexedDB for DOFU MANAGEMENT SYSTEM
// IndexedDB allows 250MB+ of offline storage without hitting the 5MB browser localStorage limit.

const DB_NAME = 'dofu_management_store';
const DB_VERSION = 1;
const STORE_NAME = 'collections';

let dbInstance = null;

const getDB = () => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this browser environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e) => {
      dbInstance = e.target.result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.warn('Failed to open IndexedDB:', e.target.error);
      reject(e.target.error);
    };
  });
};

/**
 * Retrieve an entire collection from IndexedDB
 */
export const getIdbCollection = async (collectionName) => {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(collectionName);
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
};

/**
 * Store an entire collection into IndexedDB (supports large base64 photos easily)
 */
export const setIdbCollection = async (collectionName, items) => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(items, collectionName);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => {
        console.warn(`IndexedDB put failed for ${collectionName}:`, e.target.error);
        reject(e.target.error);
      };
    });
  } catch (err) {
    console.warn(`IndexedDB write error on ${collectionName}:`, err);
    return false;
  }
};

/**
 * Clear collections from IndexedDB (e.g. for owner factory reset)
 */
export const clearIdbCollections = async () => {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
};
