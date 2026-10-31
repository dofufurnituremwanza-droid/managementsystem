import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Toast } from './components/Layout/Toast';
import { LoginView } from './components/Auth/LoginView';

// Views
import { DashboardView } from './components/Dashboard/DashboardView';
import { NotebookView } from './components/Notebook/NotebookView';
import { OrdersList } from './components/Orders/OrdersList';
import { ProjectsList } from './components/Projects/ProjectsList';
import { ClientsList } from './components/Clients/ClientsList';
import { InvoicesList } from './components/Billing/InvoicesList';
import { InventoryList } from './components/Inventory/InventoryList';
import { ExpensesList } from './components/Expenses/ExpensesList';
import { SettingsView } from './components/Settings/SettingsView';

// Modals
import { NoteModal } from './components/Notebook/NoteModal';
import { OrderModal } from './components/Orders/OrderModal';
import { JobCardPrint } from './components/Orders/JobCardPrint';
import { ProjectModal } from './components/Projects/ProjectModal';
import { ClientModal } from './components/Clients/ClientModal';
import { InvoiceModal } from './components/Billing/InvoiceModal';
import { InvoicePrintView } from './components/Billing/InvoicePrintView';
import { InventoryModal } from './components/Inventory/InventoryModal';
import { ExpenseModal } from './components/Expenses/ExpenseModal';
import { FirebaseConfigModal } from './components/Settings/FirebaseConfigModal';

const MainLayout = () => {
  const { activeTab } = useApp();

  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-viewport">
        <Header />

        <div className="page-content">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'notebook' && <NotebookView />}
          {activeTab === 'orders' && <OrdersList />}
          {activeTab === 'projects' && <ProjectsList />}
          {activeTab === 'clients' && <ClientsList />}
          {activeTab === 'billing' && <InvoicesList />}
          {activeTab === 'inventory' && <InventoryList />}
          {activeTab === 'expenses' && <ExpensesList />}
          {activeTab === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* Global Modals & Overlays */}
      <NoteModal />
      <OrderModal />
      <JobCardPrint />
      <ProjectModal />
      <ClientModal />
      <InvoiceModal />
      <InvoicePrintView />
      <InventoryModal />
      <ExpenseModal />
      <FirebaseConfigModal />

      <Toast />
    </div>
  );
};

const AppContent = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <Toast />
      </>
    );
  }

  return <MainLayout />;
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
