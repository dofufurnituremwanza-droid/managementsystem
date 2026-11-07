import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Database,
  Building2,
  DollarSign,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Save,
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Key,
  Sun,
  Moon,
  Check,
  Smartphone,
  Laptop
} from 'lucide-react';
import { FIRESTORE_RULES } from '../../firebase/securityRules';

export const SettingsView = () => {
  const {
    settings,
    updateSettings,
    firebaseState,
    setModalConfig,
    triggerSyncToFirestore,
    syncing,
    showToast,
    clients,
    orders,
    projects,
    invoices,
    expenses,
    staff,
    addStaff,
    removeStaff,
    theme,
    setTheme,
    triggerInstallApp,
    isStandalone,
    isIOS,
    clearAllSystemData
  } = useApp();

  const [formData, setFormData] = useState({ ...settings });
  const [showNewStaffForm, setShowNewStaffForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    username: '',
    password: ''
  });
  const [revealedPasswords, setRevealedPasswords] = useState({});

  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings({
      ...formData,
      taxRate: Number(formData.taxRate) || 0
    });
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    const cleanUser = (newStaff.username || '').trim();
    const cleanPass = (newStaff.password || '').trim();
    const cleanName = (newStaff.name || '').trim();

    if (!cleanUser || !cleanPass || !cleanName) {
      showToast('Please provide Name, Username, and Password for the assistant.', 'error');
      return;
    }

    if (cleanUser.toUpperCase() === 'DOFU') {
      showToast('Username "DOFU" is reserved for the Owner.', 'error');
      return;
    }

    // Check duplicate
    if (staff.some((s) => s.username?.toUpperCase() === cleanUser.toUpperCase())) {
      showToast(`Assistant with username "${cleanUser}" already exists.`, 'error');
      return;
    }

    try {
      await addStaff({
        name: cleanName,
        username: cleanUser,
        password: cleanPass
      });
      setNewStaff({ name: '', username: '', password: '' });
      setShowNewStaffForm(false);
      showToast(`Assistant account "${cleanName}" created successfully!`);
    } catch (err) {
      showToast(`Failed to create assistant: ${err.message}`, 'error');
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove assistant "${name}"? They will no longer be able to log in.`)) {
      await removeStaff(id);
    }
  };

  const togglePasswordVisibility = (id) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Export full JSON backup
  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      business: settings.businessName,
      clients,
      orders,
      projects,
      invoices,
      expenses,
      settings
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DOFU_Database_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Complete DOFU database exported safely to JSON!');
  };

  // Factory reset / Clear all recorded system data
  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ ATTENTION: Are you sure you want to CLEAR ALL RECORDED SYSTEM DATA?\n\n' +
      'This will wipe all customer orders, clients, invoices, expenses, projects, and notes so the system starts 100% clean.\n\n' +
      'Your business profile settings and passwords will be preserved.\n\n' +
      'Click OK to proceed with clearing all data.'
    );
    if (!confirmed) return;

    const doubleCheck = window.prompt(
      'Type "CLEAR" in capital letters to confirm wiping all recorded business data:'
    );
    if (doubleCheck !== 'CLEAR') {
      showToast('Action cancelled. Data was not cleared.', 'info');
      return;
    }

    const success = await clearAllSystemData();
    if (success) {
      showToast('All system records cleared! Everything is reset to 0.', 'success');
    }
  };

  const copyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES);
    showToast('Firestore security rules copied to clipboard!');
  };

  return (
    <div style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      {/* Enterprise Database Synchronization */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.15)' }}>
              <Database size={22} color="var(--gold-primary)" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--text-main)' }}>
                DOFU Cloud Database Synchronization
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {firebaseState.isConnected
                  ? `Live backend connected (${firebaseState.projectId}) — All orders, clients and invoices sync automatically.`
                  : 'Backend connection ready. Once configured, data automatically syncs across all devices.'}
              </p>
            </div>
          </div>

          {firebaseState.isConnected && (
            <button
              className="btn btn-primary btn-sm"
              onClick={triggerSyncToFirestore}
              disabled={syncing}
            >
              <RefreshCw size={13} className={syncing ? 'spin' : ''} />
              <span>{syncing ? 'Syncing...' : 'Sync Cloud Records'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION FOR DARK AND LIGHT MODE */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div className="stat-icon-wrap" style={{ background: 'rgba(197, 160, 89, 0.15)', color: 'var(--gold-primary)' }}>
            <Sun size={22} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-main)', margin: 0 }}>
              Display Theme & Appearance (Dark & Light Mode)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Choose your preferred visual mode for showroom displays, office computers, and workshop tablets
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Dark Mode Card */}
          <div
            onClick={() => setTheme('dark')}
            style={{
              cursor: 'pointer',
              borderRadius: '12px',
              padding: '18px 20px',
              border: theme === 'dark' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
              background: theme === 'dark' ? 'rgba(197, 160, 89, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: theme === 'dark' ? '0 4px 20px rgba(197, 160, 89, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#12151b',
                    color: '#e5c07b',
                    border: '1px solid rgba(197, 160, 89, 0.3)'
                  }}
                >
                  <Moon size={18} />
                </span>
                <div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>Dark Luxury Mode</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gold-light)' }}>Recommended Default</span>
                </div>
              </div>

              {theme === 'dark' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'var(--gold-primary)',
                    color: '#0c0e12',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                  Active
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Deep obsidian styling with glowing Tanzanian hardwood & gold accents. Ideal for low-light environments and battery saving.
            </p>
          </div>

          {/* Light Mode Card */}
          <div
            onClick={() => setTheme('light')}
            style={{
              cursor: 'pointer',
              borderRadius: '12px',
              padding: '18px 20px',
              border: theme === 'light' ? '2px solid var(--gold-primary)' : '1px solid var(--border-subtle)',
              background: theme === 'light' ? 'rgba(197, 160, 89, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: theme === 'light' ? '0 4px 20px rgba(197, 160, 89, 0.15)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(197, 160, 89, 0.12)',
                    color: 'var(--gold-primary)',
                    border: '1px solid rgba(197, 160, 89, 0.4)'
                  }}
                >
                  <Sun size={18} />
                </span>
                <div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>Light Luxury Mode</strong>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>High Clarity Display</span>
                </div>
              </div>

              {theme === 'light' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'var(--gold-primary)',
                    color: '#0c0e12',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  <Check size={12} strokeWidth={3} />
                  Active
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Crisp ivory surfaces with refined golden oak accents and dark charcoal typography. Perfect for bright daylight showrooms.
            </p>
          </div>
        </div>
      </div>

      {/* Business Profile & Invoicing Branding Settings */}
      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div className="stat-icon-wrap">
            <Building2 size={22} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-main)' }}>
              Business Profile & Invoice Settings
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Information displayed on official DOFU quotations, invoices, and workshop job cards
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Business Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Tagline / Motto</label>
            <input
              type="text"
              className="form-input"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Business Phone Number *</label>
            <input
              type="tel"
              required
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Business Email</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group form-full">
            <label>Showroom & Workshop Physical Address *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Currency Code (e.g. TZS, USD, KES)</label>
            <input
              type="text"
              className="form-input"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Currency Symbol (e.g. TSh, $, KSh, £)</label>
            <input
              type="text"
              className="form-input"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Default Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              className="form-input"
              placeholder="0"
              value={formData.taxRate === 0 || formData.taxRate === '' ? '' : (formData.taxRate ?? '')}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const clean = e.target.value === '' ? '' : e.target.value.replace(/^0+(?=\d)/, '');
                setFormData({ ...formData, taxRate: clean });
              }}
            />
          </div>

          <div className="form-group form-full">
            <label>Bank & Mobile Money Payment Details (Printed on Invoices)</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '100px' }}
              value={formData.paymentDetails}
              onChange={(e) => setFormData({ ...formData, paymentDetails: e.target.value })}
            />
          </div>

          <div className="form-group form-full">
            <label>Standard Terms & Conditions (Printed on Quotations & Invoices)</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: '110px' }}
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            />
          </div>

          <div className="form-group form-full">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-primary)' }}>
              <Key size={14} />
              <span>Owner Master Password (Used by DOFU to Access All Features)</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.ownerPassword || 'DOFU5060'}
              onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
              placeholder="e.g. DOFU5060"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Default: <code>DOFU5060</code>. Keep this secret. This password gives complete access to expenses, profit, and cloud settings.
            </p>
          </div>

          <div className="form-full" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Business Settings</span>
            </button>
          </div>
        </div>
      </form>

      {/* Staff & Assistant Access Control Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              <Users size={22} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--text-main)' }}>
                Staff & Assistant Access Control
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Create accounts for sales & front-desk assistants. Assistants can take orders, add customers, and print receipts without seeing your financial margins, expenses, or notes.
              </p>
            </div>
          </div>

          <button
            className="btn btn-outline-gold"
            onClick={() => setShowNewStaffForm(!showNewStaffForm)}
          >
            <UserPlus size={15} />
            <span>{showNewStaffForm ? 'Cancel' : 'Add New Assistant'}</span>
          </button>
        </div>

        {/* New Assistant Account Form */}
        {showNewStaffForm && (
          <form
            onSubmit={handleAddStaff}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(197, 160, 89, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}
          >
            <h4 style={{ color: 'var(--gold-primary)', fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={16} />
              <span>Create Assistant Login Credentials</span>
            </h4>

            <div className="form-grid">
              <div className="form-group">
                <label>Assistant Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Amani Mwita (Sales)"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Login Username *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. amani"
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Login Password *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. dofu2026"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }}>
                  <ShieldCheck size={16} />
                  <span>Save Assistant Account</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Existing Staff Table / List */}
        <div style={{ marginBottom: '22px' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Active Assistant Accounts ({staff.length})
          </h4>

          {staff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '26px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px dashed var(--border-subtle)' }}>
              <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.35 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>
                No assistant accounts created yet. Click "Add New Assistant" above to create an account for your staff.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {staff.map((member) => {
                const isPasswordRevealed = Boolean(revealedPasswords[member.id]);
                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(96, 165, 250, 0.15)',
                          color: '#60a5fa',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
                        }}
                      >
                        {member.name ? member.name[0].toUpperCase() : 'A'}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-main)', fontSize: '0.92rem', display: 'block' }}>
                          {member.name}
                        </strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                          <span>Username: <code style={{ color: '#60a5fa' }}>{member.username}</code></span>
                          <span>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Password: <code style={{ color: 'var(--gold-light)' }}>{isPasswordRevealed ? member.password : '••••••••'}</code>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(member.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px' }}
                              title={isPasswordRevealed ? 'Hide Password' : 'Show Password'}
                            >
                              {isPasswordRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        Sales & Orders Assistant
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#f87171', padding: '6px 8px' }}
                        onClick={() => handleDeleteStaff(member.id, member.name)}
                        title="Delete Assistant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear Permissions Matrix Callout */}
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            background: 'rgba(12, 14, 18, 0.6)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <h5 style={{ color: 'var(--text-main)', fontSize: '0.86rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} color="var(--gold-primary)" />
            <span>Assistant vs. Owner Privacy & Permissions Matrix</span>
          </h5>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', fontSize: '0.78rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ color: '#10b981', fontWeight: 700, marginBottom: '6px' }}>
                ✅ What Assistants CAN Do:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Take customer orders (furniture specs, timber, upholstery)</li>
                <li>Add & update customer directory records (CRM)</li>
                <li>Create quotes, sales invoices & record payments</li>
                <li>Print official customer receipts & workshop job cards</li>
                <li>Update order production stages (carpentry, upholstery, QC, dispatch)</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ color: '#f87171', fontWeight: 700, marginBottom: '6px' }}>
                🔒 Strictly Hidden From Assistants (Owner Only):
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>Workshop expenses (artisan wages, timber costs, rent, fuel)</li>
                <li>Financial profit, total revenue & operating margin cards</li>
                <li>DOFU's personal notebook, carpenter measurements & private memos</li>
                <li>Interior design projects & site planning specifications</li>
                <li>System settings, cloud database credentials & staff logins</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* App Installation & Mobile Devices (PWA) */}
      <div className="card" style={{ border: '1px solid rgba(197, 160, 89, 0.35)', background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.05) 0%, rgba(22, 26, 34, 0.8) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '650px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(197, 160, 89, 0.15)',
              border: '1px solid rgba(197, 160, 89, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-light)',
              flexShrink: 0
            }}>
              <Smartphone size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', margin: 0 }}>
                  DOFU System Device Installation (PWA)
                </h4>
                {isStandalone ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }}>
                    <CheckCircle2 size={12} /> Installed App
                  </span>
                ) : (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(197, 160, 89, 0.15)',
                    border: '1px solid rgba(197, 160, 89, 0.3)',
                    color: 'var(--gold-primary)',
                    fontSize: '0.72rem',
                    fontWeight: 600
                  }}>
                    Available for Install
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '6px', marginBottom: 0 }}>
                Install DOFU Management System onto any iPhone, iPad, Android phone, tablet, or Windows/Mac laptop. Runs in full-screen standalone mode with offline cache and instant home-screen launching.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={triggerInstallApp}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Smartphone size={16} />
              <span>{isStandalone ? 'View Device Instructions' : 'Install App on this Device'}</span>
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '16px',
          paddingTop: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          fontSize: '0.76rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>📱 iPhone / Safari:</span>
            <span>Tap the Safari <strong>Share</strong> button, then select <strong>Add to Home Screen</strong>.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>🤖 Android / Chrome:</span>
            <span>Tap <strong>Install App</strong> above or select <strong>Add to Home screen</strong> from the menu.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>💻 PC / Laptop:</span>
            <span>Click the install icon in your browser address bar or click the install button above.</span>
          </div>
        </div>
      </div>

      {/* Database Backup & Export Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h4 style={{ color: 'var(--text-main)', fontSize: '1.05rem', marginBottom: '4px' }}>
              Full Offline JSON Data Backup
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              Download a complete JSON snapshot containing all your clients, custom furniture orders, interior design projects, quotations, invoices, and workshop expenses.
            </p>
          </div>

          <button className="btn btn-secondary" onClick={handleExportBackup}>
            <Download size={15} />
            <span>Export Backup</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Clear All System Data / Factory Reset */}
      <div className="card" style={{ border: '1px solid rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h4 style={{ color: '#ef4444', fontSize: '1.05rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trash2 size={18} />
              <span>Clear All Recorded System Data (Factory Reset)</span>
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: 0 }}>
              Wipe all customer orders, client directory, invoices, workshop expenses, and notes to start 100% fresh. Business profile and login credentials remain safe.
            </p>
          </div>

          <button
            className="btn btn-danger"
            onClick={handleClearAllData}
            title="Wipe all recorded business transactions"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Trash2 size={16} />
            <span>Clear Everything</span>
          </button>
        </div>
      </div>
    </div>
  );
};
