import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  Armchair,
  Compass,
  Users,
  FileText,
  Receipt,
  Settings,
  Database,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  X
} from 'lucide-react';

export const Sidebar = () => {
  const {
    activeTab,
    setActiveTab,
    mobileMenuOpen,
    setMobileMenuOpen,
    clients,
    currentUser,
    isOwner,
    isAssistant,
    logout,
    theme,
    toggleTheme,
    orders,
    projects,
    invoices,
    notes
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

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'notebook',
      label: "DOFU's Notebook",
      icon: BookOpen,
      badge: notes.length > 0 ? notes.length : null,
      ownerOnly: true
    },
    {
      id: 'orders',
      label: 'Customer Orders',
      icon: Armchair,
      badge: pendingOrders > 0 ? pendingOrders : null
    },
    {
      id: 'projects',
      label: 'Interior Design',
      icon: Compass,
      badge: activeProjects > 0 ? activeProjects : null,
      ownerOnly: true
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
    { id: 'expenses', label: 'Workshop Expenses', icon: Receipt, ownerOnly: true },
    { id: 'settings', label: 'Settings & Cloud', icon: Settings, ownerOnly: true }
  ];

  const navItems = isAssistant
    ? allNavItems.filter((item) => !item.ownerOnly)
    : allNavItems;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
              <div className={`status-dot ${isAssistant ? 'warning' : 'online'}`} />
              <div className="status-info" style={{ minWidth: 0 }}>
                <span className="status-title" style={{ color: '#fff', fontWeight: 600, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {currentUser?.name || currentUser?.username || 'DOFU'}
                </span>
                <span className="status-sub" style={{ color: isAssistant ? '#60a5fa' : 'var(--gold-primary)', fontSize: '0.72rem' }}>
                  {isAssistant ? 'Sales Assistant' : 'Owner / Admin'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '5px 8px', color: 'var(--text-secondary)', flexShrink: 0 }}
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun size={14} color="#e5c07b" /> : <Moon size={14} color="#b8860b" />}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ padding: '5px 8px', color: 'var(--text-secondary)', flexShrink: 0 }}
                onClick={logout}
                title="Sign Out / Lock Portal"
              >
                <LogOut size={14} />
              </button>
            </div>
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
