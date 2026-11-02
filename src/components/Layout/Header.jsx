import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Plus,
  BookOpen,
  Armchair,
  Compass,
  FileText,
  UserPlus,
  Receipt,
  Database
} from 'lucide-react';

const TAB_META = {
  dashboard: { title: 'Business Overview', subtitle: 'Real-time performance, active jobs & financials' },
  notebook: { title: "DOFU's Personal Notebook", subtitle: 'Quick reminders, carpenter measurements, follow-ups & to-do memos' },
  orders: { title: 'Bespoke Furniture Orders', subtitle: 'Carpentry, upholstery & delivery production pipeline' },
  projects: { title: 'Interior Design Projects', subtitle: 'Moodboards, room specs, site measurements & stages' },
  clients: { title: 'Clients Directory', subtitle: 'Client records, order history & site locations' },
  billing: { title: 'Quotations & Invoices', subtitle: 'Create proforma quotes, tax invoices & record payments' },
  expenses: { title: 'Workshop Expenses', subtitle: 'Material supplies, artisan wages, transport & overheads' },
  settings: { title: 'Settings & Cloud Database', subtitle: 'Firebase connection, business profile & printable terms' }
};

export const Header = () => {
  const {
    activeTab,
    setActiveTab,
    setMobileMenuOpen,
    setModalConfig,
    currentUser,
    isOwner,
    isAssistant
  } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentMeta = TAB_META[activeTab] || { title: 'Management', subtitle: 'DOFU System' };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="top-header no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <button
          className="mobile-menu-btn btn btn-secondary btn-sm"
          id="mobile-menu-trigger"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open Navigation Menu"
          title="Open Menu"
        >
          <Menu size={18} />
        </button>
        <div className="header-title-group">
          <h2>{currentMeta.title}</h2>
          <p>{currentMeta.subtitle}</p>
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Role Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '20px',
            background: isAssistant ? 'rgba(96, 165, 250, 0.12)' : 'rgba(197, 160, 89, 0.12)',
            border: `1px solid ${isAssistant ? 'rgba(96, 165, 250, 0.3)' : 'rgba(197, 160, 89, 0.3)'}`,
            fontSize: '0.75rem',
            color: isAssistant ? '#93c5fd' : 'var(--gold-primary)'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAssistant ? '#60a5fa' : 'var(--gold-primary)' }} />
          <span>{isAssistant ? `Assistant: ${currentUser?.name || currentUser?.username}` : 'Owner / Admin'}</span>
        </div>

        {/* Quick New Creation Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            className="btn btn-primary"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ padding: '8px 14px' }}
          >
            <Plus size={16} />
            <span className="btn-label-desktop">Create New</span>
            <span className="btn-label-mobile">New</span>
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                background: '#161a24',
                border: '1px solid rgba(197, 160, 89, 0.35)',
                borderRadius: '12px',
                width: '230px',
                padding: '8px',
                boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                zIndex: 110,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              {isOwner && (
                <button
                  className="nav-btn"
                  onClick={() => {
                    setDropdownOpen(false);
                    setActiveTab('notebook');
                  }}
                >
                  <BookOpen size={16} color="#c5a059" />
                  <span>DOFU's Notebook</span>
                </button>
              )}

              <button
                className="nav-btn"
                onClick={() => {
                  setDropdownOpen(false);
                  setModalConfig({ type: 'new_order' });
                }}
              >
                <Armchair size={16} color="#c5a059" />
                <span>Take Customer Order</span>
              </button>

              {isOwner && (
                <button
                  className="nav-btn"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModalConfig({ type: 'new_project' });
                  }}
                >
                  <Compass size={16} color="#c5a059" />
                  <span>Interior Design Project</span>
                </button>
              )}

              <button
                className="nav-btn"
                onClick={() => {
                  setDropdownOpen(false);
                  setModalConfig({ type: 'new_invoice' });
                }}
              >
                <FileText size={16} color="#c5a059" />
                <span>Quote / Invoice / Sale</span>
              </button>

              <button
                className="nav-btn"
                onClick={() => {
                  setDropdownOpen(false);
                  setModalConfig({ type: 'new_client' });
                }}
              >
                <UserPlus size={16} color="#c5a059" />
                <span>Client Record</span>
              </button>

              {isOwner && (
                <button
                  className="nav-btn"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModalConfig({ type: 'new_expense' });
                  }}
                >
                  <Receipt size={16} color="#c5a059" />
                  <span>Workshop Expense</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
