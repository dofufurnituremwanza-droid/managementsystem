import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Armchair,
  Compass,
  Users,
  FileText,
  Boxes,
  Receipt,
  Settings,
  Database,
  RefreshCw,
  LogOut,
  X
} from 'lucide-react';

export const Sidebar = () => {
  const {
    activeTab,
    setActiveTab,
    mobileMenuOpen,
    setMobileMenuOpen,
    firebaseState,
    setModalConfig,
    clients,
    currentUser,
    logout,
    orders,
    projects,
    invoices,
    triggerSyncToFirestore,
    syncing
  } = useApp();

  // Active counts for badges
  const pendingOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;

  const activeProjects = projects.filter(
    (p) => p.stage !== 'completed' && p.stage !== 'cancelled'
  ).length;

  const unpaidInvoices = invoices.filter(
    (i) => i.status === 'unpaid' || i.status === 'partial'
  ).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'orders',
      label: 'Furniture Orders',
      icon: Armchair,
      badge: pendingOrders > 0 ? pendingOrders : null
    },
    {
      id: 'projects',
      label: 'Interior Design',
      icon: Compass,
      badge: activeProjects > 0 ? activeProjects : null
    },
    {
      id: 'clients',
      label: 'Clients & CRM',
      icon: Users,
      badge: clients.length > 0 ? clients.length : null
    },
    {
      id: 'billing',
      label: 'Quotes & Invoices',
      icon: FileText,
      badge: unpaidInvoices > 0 ? unpaidInvoices : null
    },
    { id: 'inventory', label: 'Inventory & Stock', icon: Boxes },
    { id: 'expenses', label: 'Workshop Expenses', icon: Receipt },
    { id: 'settings', label: 'Settings & Cloud', icon: Settings }
  ];

  return (
    <>
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Header / Brand */}
        <div className="sidebar-header">
          <img src="/logo.png" alt="DOFU Logo" className="brand-logo-img" />
          <div className="brand-text">
            <h1>DOFU</h1>
            <p>Furniture & Interior</p>
          </div>
          {mobileMenuOpen && (
            <button
              className="modal-close-btn no-print"
              style={{ marginLeft: 'auto' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">Management</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Clean System Status & User Logout Footer */}
        <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div className="status-dot online" />
              <div className="status-info">
                <span className="status-title" style={{ color: '#fff', fontWeight: 600 }}>
                  {currentUser || 'DOFU'}
                </span>
                <span className="status-sub">Cloud Synced</span>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '5px 8px', color: 'var(--text-secondary)' }}
              onClick={logout}
              title="Sign Out / Lock Portal"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 99 }}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};
