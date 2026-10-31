import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToCollection,
  createRecord,
  updateRecord,
  deleteRecord,
  syncAllLocalToFirestore
} from '../firebase/db';
import {
  subscribeConnectionState,
  initFirebase,
  testFirebaseConnection,
  saveFirebaseConfig,
  clearFirebaseConfig,
  getStoredFirebaseConfig
} from '../firebase/config';

const AppContext = createContext();

const DEFAULT_SETTINGS = {
  businessName: 'DOFU FURNITURE MWANZA',
  tagline: 'Custom Bespoke Furniture & Luxury Interior Architecture',
  email: 'dofufurnituremwanza@gmail.com',
  phone: '+255769456793',
  address: 'BUGARIKA SOKON, BUGANDO, MWANZA',
  currency: 'TZS',
  currencySymbol: 'TSh',
  taxRate: 0,
  paymentDetails: 'M-Pesa / Tigo Pesa: +255 769 456 793\nBank: CRDB Bank / NMB Bank\nAccount Name: DOFU FURNITURE MWANZA',
  terms: '1. 50% commitment deposit required before production begins.\n2. Balance upon final inspection & delivery.\n3. Custom furniture crafted with premium Tanzanian hardwoods.'
};

export const AppProvider = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Collections - ZERO DUMMY DATA! All start empty!
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [projects, setProjects] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notes, setNotes] = useState([]);
  
  // Settings with DOFU Mwanza details
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dofu_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          phone: parsed.phone && parsed.phone !== '+255 700 000 000' ? parsed.phone : '+255769456793',
          address: parsed.address && !parsed.address.includes('Plot 42') ? parsed.address : 'BUGARIKA SOKON, BUGANDO, MWANZA',
          businessName: parsed.businessName && !parsed.businessName.includes('Plot 42') ? parsed.businessName : 'DOFU FURNITURE MWANZA',
          email: parsed.email && !parsed.email.includes('dofudesigns') ? parsed.email : 'dofufurnituremwanza@gmail.com'
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Firebase connection state
  const [firebaseState, setFirebaseState] = useState({
    isConfigured: false,
    isConnected: false,
    projectId: null,
    error: null
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('dofu_auth_session') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return localStorage.getItem('dofu_auth_session') === 'true' ? 'DOFU' : null;
    } catch {
      return null;
    }
  });

  // Login handler
  const login = (username, password) => {
    const cleanUser = (username || '').trim().toUpperCase();
    const cleanPass = (password || '').trim();

    if (cleanUser === 'DOFU' && cleanPass === 'DOFU5060') {
      try {
        localStorage.setItem('dofu_auth_session', 'true');
      } catch (e) {
        console.warn('Storage error', e);
      }
      setIsAuthenticated(true);
      setCurrentUser('DOFU');
      showToast('Welcome back, DOFU Management!');
      return { success: true };
    } else {
      return {
        success: false,
        message: 'Invalid username or password. Please verify credentials.'
      };
    }
  };

  // Logout handler
  const logout = () => {
    try {
      localStorage.removeItem('dofu_auth_session');
    } catch (e) {
      console.warn('Storage error', e);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('Signed out of DOFU terminal.');
  };

  // Loading states
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Active modals & overlays
  const [modalConfig, setModalConfig] = useState({ type: null, data: null });
  const [toast, setToast] = useState(null);

  // Show Toast
  const showToast = (message, type = 'success', duration = 4000) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, duration);
  };

  // Subscribe to Firebase connection status
  useEffect(() => {
    const unsub = subscribeConnectionState((state) => {
      setFirebaseState(state);
    });
    return unsub;
  }, []);

  // Subscribe to all Collections
  useEffect(() => {
    const unsubs = [];

    // Clients
    unsubs.push(subscribeToCollection('clients', (data) => setClients(data)));
    // Orders
    unsubs.push(subscribeToCollection('orders', (data) => setOrders(data)));
    // Projects
    unsubs.push(subscribeToCollection('projects', (data) => setProjects(data)));
    // Inventory
    unsubs.push(subscribeToCollection('inventory', (data) => setInventory(data)));
    // Invoices
    unsubs.push(subscribeToCollection('invoices', (data) => setInvoices(data)));
    // Direct Showroom Sales
    unsubs.push(subscribeToCollection('sales', (data) => setSales(data)));
    // Expenses
    unsubs.push(subscribeToCollection('expenses', (data) => setExpenses(data)));
    // Personal Notebook & Reminders
    unsubs.push(subscribeToCollection('notes', (data) => setNotes(data)));

    setLoading(false);

    return () => {
      unsubs.forEach((unsub) => typeof unsub === 'function' && unsub());
    };
  }, [firebaseState.isConnected]);

  // Save Settings
  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('dofu_settings', JSON.stringify(updated));
    showToast('Business settings updated successfully!');
  };

  // Configure Firebase Credentials
  const configureFirebase = async (config) => {
    try {
      setSyncing(true);
      const test = await testFirebaseConnection(config);
      if (!test.success) {
        showToast(test.message, 'error', 6000);
        setSyncing(false);
        return false;
      }

      saveFirebaseConfig(config);
      initFirebase();
      showToast(test.message, 'success', 5000);
      setSyncing(false);
      return true;
    } catch (e) {
      showToast('Error connecting to Firebase: ' + e.message, 'error');
      setSyncing(false);
      return false;
    }
  };

  // Disconnect Firebase
  const disconnectFirebase = () => {
    clearFirebaseConfig();
    initFirebase();
    showToast('Disconnected from Firebase. Operating in local mode.', 'warning');
  };

  // Sync all local records to live Firestore
  const triggerSyncToFirestore = async () => {
    if (!firebaseState.isConnected) {
      showToast('Firebase is not connected yet.', 'error');
      return;
    }
    setSyncing(true);
    try {
      const count = await syncAllLocalToFirestore([
        'clients',
        'orders',
        'projects',
        'inventory',
        'invoices',
        'sales',
        'expenses'
      ]);
      showToast(`Synced ${count} items to Cloud Firestore!`, 'success');
    } catch (err) {
      showToast('Sync failed: ' + err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Currency Formatter Helper
  const formatMoney = (amount) => {
    const num = Number(amount) || 0;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
    return `${settings.currencySymbol || '$'} ${formatted}`;
  };

  // CRUD helpers
  const addItem = async (collectionName, data) => {
    try {
      const record = await createRecord(collectionName, data);
      showToast(`Added to ${collectionName} successfully!`);
      return record;
    } catch (err) {
      showToast(`Failed to add record: ${err.message}`, 'error');
      throw err;
    }
  };

  const editItem = async (collectionName, id, updates) => {
    try {
      const record = await updateRecord(collectionName, id, updates);
      showToast(`Updated ${collectionName} successfully!`);
      return record;
    } catch (err) {
      showToast(`Failed to update record: ${err.message}`, 'error');
      throw err;
    }
  };

  const removeItem = async (collectionName, id) => {
    try {
      await deleteRecord(collectionName, id);
      showToast(`Deleted from ${collectionName}.`);
      return true;
    } catch (err) {
      showToast(`Failed to delete record: ${err.message}`, 'error');
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Authentication
        isAuthenticated,
        currentUser,
        login,
        logout,
        // Navigation
        activeTab,
        setActiveTab,
        mobileMenuOpen,
        setMobileMenuOpen,
        // Data Collections
        clients,
        orders,
        projects,
        inventory,
        invoices,
        sales,
        expenses,
        notes,
        settings,
        updateSettings,
        // Firebase State & Sync
        firebaseState,
        configureFirebase,
        disconnectFirebase,
        triggerSyncToFirestore,
        syncing,
        loading,
        // CRUD
        addItem,
        editItem,
        removeItem,
        // Modals & Feedback
        modalConfig,
        setModalConfig,
        toast,
        showToast,
        // Helpers
        formatMoney
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
