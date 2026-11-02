import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeToCollection,
  createRecord,
  updateRecord,
  deleteRecord,
  syncAllLocalToFirestore,
  getLocalCollection
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
  terms: '1. 50% commitment deposit required before production begins.\n2. Balance upon final inspection & delivery.\n3. Custom furniture crafted with premium Tanzanian hardwoods.',
  ownerPassword: 'DOFU5060'
};

const getStoredSession = () => {
  try {
    const saved = localStorage.getItem('dofu_auth_session');
    if (!saved) return null;
    if (saved === 'true') {
      return { username: 'DOFU', name: 'DOFU Owner', role: 'owner' };
    }
    const parsed = JSON.parse(saved);
    if (parsed && (parsed.role === 'owner' || parsed.role === 'assistant')) {
      return parsed;
    }
    return { username: 'DOFU', name: 'DOFU Owner', role: 'owner' };
  } catch {
    return null;
  }
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
  const [staff, setStaff] = useState([]);
  
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
  const [currentUser, setCurrentUser] = useState(() => getStoredSession());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredSession()));

  const isOwner = currentUser?.role === 'owner' || (!currentUser?.role && currentUser?.username === 'DOFU');
  const isAssistant = currentUser?.role === 'assistant';

  // Guard: if an assistant is on a restricted tab, redirect them immediately to orders
  useEffect(() => {
    if (isAssistant) {
      const forbiddenTabs = ['expenses', 'notebook', 'projects', 'settings'];
      if (forbiddenTabs.includes(activeTab)) {
        setActiveTab('orders');
      }
    }
  }, [isAssistant, activeTab]);

  // Login handler supporting Owner & Staff
  const login = (username, password) => {
    const cleanUser = (username || '').trim().toUpperCase();
    const cleanPass = (password || '').trim();
    const expectedOwnerPass = settings.ownerPassword || 'DOFU5060';

    // 1. Check Owner login
    if (cleanUser === 'DOFU' && cleanPass === expectedOwnerPass) {
      const ownerUser = {
        username: 'DOFU',
        name: 'DOFU Owner',
        role: 'owner'
      };
      try {
        localStorage.setItem('dofu_auth_session', JSON.stringify(ownerUser));
      } catch (e) {
        console.warn('Storage error', e);
      }
      setIsAuthenticated(true);
      setCurrentUser(ownerUser);
      showToast('Welcome back, DOFU Management!');
      return { success: true };
    }

    // 2. Check Assistant / Staff login
    const staffPool = staff.length > 0 ? staff : getLocalCollection('staff');
    const matchedStaff = staffPool.find(
      (s) =>
        (s.username || '').trim().toUpperCase() === cleanUser &&
        (s.password || '').trim() === cleanPass &&
        s.status !== 'inactive'
    );

    if (matchedStaff) {
      const assistantUser = {
        id: matchedStaff.id,
        username: matchedStaff.username,
        name: matchedStaff.name || matchedStaff.username,
        role: 'assistant'
      };
      try {
        localStorage.setItem('dofu_auth_session', JSON.stringify(assistantUser));
      } catch (e) {
        console.warn('Storage error', e);
      }
      setIsAuthenticated(true);
      setCurrentUser(assistantUser);
      setActiveTab('orders');
      showToast(`Welcome, ${assistantUser.name}! (Sales & Orders Assistant)`);
      return { success: true };
    }

    return {
      success: false,
      message: 'Invalid username or password. Please verify credentials or contact the owner.'
    };
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
    // Staff & Assistants
    unsubs.push(subscribeToCollection('staff', (data) => setStaff(data)));

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
        'expenses',
        'notes',
        'staff'
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
      const now = new Date();
      const localDateStr = now.toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
      const localTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const creatorName = currentUser?.name || currentUser?.username || 'DOFU Management';
      const creatorUsername = currentUser?.username || 'DOFU';
      const creatorRole = currentUser?.role || 'owner';

      const enrichedData = {
        recordedBy: data.recordedBy || creatorName,
        recordedByUsername: data.recordedByUsername || creatorUsername,
        recordedByRole: data.recordedByRole || creatorRole,
        recordedDate: data.recordedDate || localDateStr,
        recordedTime: data.recordedTime || localTimeStr,
        recordedAt: data.recordedAt || now.toISOString(),
        ...data
      };

      const record = await createRecord(collectionName, enrichedData);
      showToast(`Added to ${collectionName} successfully!`);
      return record;
    } catch (err) {
      showToast(`Failed to add record: ${err.message}`, 'error');
      throw err;
    }
  };

  const editItem = async (collectionName, id, updates) => {
    try {
      const now = new Date();
      const modifierName = currentUser?.name || currentUser?.username || 'DOFU Management';
      const enrichedUpdates = {
        ...updates,
        lastModifiedBy: modifierName,
        lastModifiedByRole: currentUser?.role || 'owner',
        lastModifiedAt: now.toISOString()
      };
      const record = await updateRecord(collectionName, id, enrichedUpdates);
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

  // Staff specific helpers
  const addStaff = async (staffData) => {
    const timestamp = new Date().toISOString();
    const cleanStaff = {
      ...staffData,
      role: 'assistant',
      status: staffData.status || 'active',
      createdAt: timestamp
    };
    return await addItem('staff', cleanStaff);
  };

  const updateStaff = async (id, updates) => {
    return await editItem('staff', id, updates);
  };

  const removeStaff = async (id) => {
    return await removeItem('staff', id);
  };

  return (
    <AppContext.Provider
      value={{
        // Authentication & Role
        isAuthenticated,
        currentUser,
        isOwner,
        isAssistant,
        login,
        logout,
        // Staff Management
        staff,
        addStaff,
        updateStaff,
        removeStaff,
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
