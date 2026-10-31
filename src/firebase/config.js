import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const STORAGE_KEY = 'dofu_firebase_config';

// Production Firebase Configuration for DOFU
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBafm_kyPV_qwjDCfUvAYc2b-eHpazywus",
  authDomain: "dofu-4009f.firebaseapp.com",
  projectId: "dofu-4009f",
  storageBucket: "dofu-4009f.firebasestorage.app",
  messagingSenderId: "449987179314",
  appId: "1:449987179314:web:193910482876c6df8e1d2b",
  measurementId: "G-5FD4EP8EZ6"
};

// Retrieve saved config from localStorage, env, or production default
export const getStoredFirebaseConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored Firebase config', err);
  }

  // Fallback to Vite env variables if present
  if (import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    };
  }

  return DEFAULT_FIREBASE_CONFIG;
};

// Save Firebase config
export const saveFirebaseConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const clearFirebaseConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
};

let appInstance = null;
let firestoreInstance = null;
let authInstance = null;
let storageInstance = null;
let connectionState = {
  isConfigured: false,
  isConnected: false,
  projectId: null,
  error: null,
  lastChecked: null
};

const listeners = new Set();
export const subscribeConnectionState = (listener) => {
  listeners.add(listener);
  listener({ ...connectionState });
  return () => listeners.delete(listener);
};

const notifyConnectionState = () => {
  listeners.forEach((listener) => listener({ ...connectionState }));
};

// Initialize Firebase App
export const initFirebase = () => {
  const config = getStoredFirebaseConfig();
  if (!config) {
    connectionState = {
      isConfigured: false,
      isConnected: false,
      projectId: null,
      error: 'Firebase is not yet configured. Provide your Firebase Project Config to connect live database.',
      lastChecked: new Date()
    };
    notifyConnectionState();
    return { app: null, db: null, auth: null, storage: null };
  }

  try {
    if (getApps().length === 0) {
      appInstance = initializeApp(config);
    } else {
      appInstance = getApp();
    }

    firestoreInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    storageInstance = getStorage(appInstance);

    connectionState = {
      isConfigured: true,
      isConnected: true,
      projectId: config.projectId,
      error: null,
      lastChecked: new Date()
    };
    notifyConnectionState();

    return {
      app: appInstance,
      db: firestoreInstance,
      auth: authInstance,
      storage: storageInstance
    };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    connectionState = {
      isConfigured: true,
      isConnected: false,
      projectId: config.projectId,
      error: error.message || 'Failed to initialize Firebase',
      lastChecked: new Date()
    };
    notifyConnectionState();
    return { app: null, db: null, auth: null, storage: null };
  }
};

// Test live connection with Firestore ping
export const testFirebaseConnection = async (testConfig = null) => {
  const configToTest = testConfig || getStoredFirebaseConfig();
  if (!configToTest || !configToTest.projectId || !configToTest.apiKey) {
    return {
      success: false,
      message: 'Please provide at least a Project ID and an API Key.'
    };
  }

  try {
    let testApp;
    const testAppName = `test-conn-${Date.now()}`;
    testApp = initializeApp(configToTest, testAppName);
    const testDb = getFirestore(testApp);

    // Attempt a light read to check connectivity and security rules
    const testRef = collection(testDb, '_dofu_healthcheck');
    await getDocs(testRef);

    return {
      success: true,
      message: `Successfully connected to Firebase project "${configToTest.projectId}"! Firestore is ready.`
    };
  } catch (err) {
    console.error('Firebase test connection failed:', err);
    // Even if permission-denied is returned, it means the server reached Firestore!
    if (err.code === 'permission-denied') {
      return {
        success: true,
        warning: true,
        message: `Connected to Firebase project "${configToTest.projectId}", but Firestore security rules restricted test collection. Ensure your rules permit read/write for your collections.`
      };
    }
    return {
      success: false,
      message: err.message || 'Connection failed. Verify API Key and Project ID.'
    };
  }
};

// Initial run
initFirebase();

export {
  appInstance as app,
  firestoreInstance as db,
  authInstance as auth,
  storageInstance as storage
};
