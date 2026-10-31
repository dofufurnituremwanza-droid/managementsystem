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
  Save
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
    expenses
  } = useApp();

  const [formData, setFormData] = useState({ ...settings });

  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSettings(formData);
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
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: '#fff' }}>
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

      {/* Business Profile & Invoicing Branding Settings */}
      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div className="stat-icon-wrap">
            <Building2 size={22} />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#fff' }}>
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
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) || 0 })}
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

          <div className="form-full" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Business Settings</span>
            </button>
          </div>
        </div>
      </form>

      {/* Database Backup & Export Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '4px' }}>
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
    </div>
  );
};
