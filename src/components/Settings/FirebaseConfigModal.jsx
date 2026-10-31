import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../Common/Modal';
import {
  getStoredFirebaseConfig,
  testFirebaseConnection
} from '../../firebase/config';
import { FIRESTORE_RULES, FIREBASE_SETUP_STEPS } from '../../firebase/securityRules';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Clipboard,
  Copy,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';

export const FirebaseConfigModal = () => {
  const {
    modalConfig,
    setModalConfig,
    configureFirebase,
    disconnectFirebase,
    firebaseState,
    triggerSyncToFirestore,
    syncing,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'guide' | 'rules'
  const savedConfig = getStoredFirebaseConfig() || {};

  const [formData, setFormData] = useState({
    projectId: savedConfig.projectId || '',
    apiKey: savedConfig.apiKey || '',
    authDomain: savedConfig.authDomain || '',
    storageBucket: savedConfig.storageBucket || '',
    messagingSenderId: savedConfig.messagingSenderId || '',
    appId: savedConfig.appId || ''
  });

  const [rawSnippet, setRawSnippet] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill from raw snippet (e.g. copied from Firebase Console)
  const handleParseSnippet = () => {
    if (!rawSnippet.trim()) return;
    try {
      const apiKeyMatch = rawSnippet.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = rawSnippet.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = rawSnippet.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = rawSnippet.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = rawSnippet.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = rawSnippet.match(/appId:\s*["']([^"']+)["']/);

      const parsed = {
        apiKey: apiKeyMatch ? apiKeyMatch[1] : formData.apiKey,
        authDomain: authDomainMatch ? authDomainMatch[1] : formData.authDomain,
        projectId: projectIdMatch ? projectIdMatch[1] : formData.projectId,
        storageBucket: storageBucketMatch ? storageBucketMatch[1] : formData.storageBucket,
        messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : formData.messagingSenderId,
        appId: appIdMatch ? appIdMatch[1] : formData.appId
      };

      setFormData(parsed);
      setRawSnippet('');
      showToast('Firebase credentials parsed and filled automatically!');
    } catch (e) {
      showToast('Could not parse snippet. Enter fields manually.', 'error');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testFirebaseConnection(formData);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await configureFirebase(formData);
    setSubmitting(false);
    if (ok) {
      setModalConfig({ type: null });
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  return (
    <Modal
      isOpen={modalConfig.type === 'firebase_config'}
      onClose={() => setModalConfig({ type: null })}
      title="Firebase Cloud Database Connection"
      size="lg"
    >
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
        <button
          className={`btn btn-sm ${activeTab === 'config' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('config')}
        >
          <Database size={15} />
          Connection Credentials
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'rules' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('rules')}
        >
          <Clipboard size={15} />
          Firestore Security Rules
        </button>
        <button
          className={`btn btn-sm ${activeTab === 'guide' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('guide')}
        >
          <Info size={15} />
          Setup Guide
        </button>
      </div>

      {/* Tab: Config */}
      {activeTab === 'config' && (
        <div>
          {/* Status banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: firebaseState.isConnected
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${
                firebaseState.isConnected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {firebaseState.isConnected ? (
                <CheckCircle2 size={20} color="#10b981" />
              ) : (
                <AlertTriangle size={20} color="#f59e0b" />
              )}
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                  {firebaseState.isConnected
                    ? `Live Cloud Database Connected (${firebaseState.projectId})`
                    : 'Currently in Local Offline Mode'}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {firebaseState.isConnected
                    ? 'All clients, furniture orders, quotes, and interior projects are syncing in real time.'
                    : 'Data is being stored safely in your browser. Connect Firebase to enable multi-device cloud sync.'}
                </p>
              </div>
            </div>

            {firebaseState.isConnected && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={disconnectFirebase}
                title="Disconnect Firebase"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Quick Paste Snippet Area */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed var(--border-subtle)',
              marginBottom: '22px'
            }}
          >
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--gold-light)',
                marginBottom: '8px'
              }}
            >
              <Zap size={14} style={{ display: 'inline', marginRight: 4 }} />
              Quick Auto-Fill: Paste full Firebase config snippet from Console
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder='const firebaseConfig = { apiKey: "AIza...", projectId: "...", ... }'
                value={rawSnippet}
                onChange={(e) => setRawSnippet(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-outline-gold btn-sm"
                onClick={handleParseSnippet}
              >
                Auto-Fill
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <div className="form-group">
                <label>Firebase Project ID *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. dofu-furniture"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Firebase API Key *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. AIzaSy..."
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Auth Domain</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. dofu-furniture.firebaseapp.com"
                  value={formData.authDomain}
                  onChange={(e) => setFormData({ ...formData, authDomain: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Storage Bucket</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. dofu-furniture.appspot.com"
                  value={formData.storageBucket}
                  onChange={(e) => setFormData({ ...formData, storageBucket: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Messaging Sender ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1092837465"
                  value={formData.messagingSenderId}
                  onChange={(e) => setFormData({ ...formData, messagingSenderId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>App ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1:1092837465:web:abcdef..."
                  value={formData.appId}
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                />
              </div>
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div
                style={{
                  marginTop: '18px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
                  fontSize: '0.84rem',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {testResult.success ? (
                  <CheckCircle2 size={18} color="#10b981" />
                ) : (
                  <AlertTriangle size={18} color="#ef4444" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
              className="firebase-modal-actions"
            >
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleTest}
                  disabled={testing || !formData.projectId || !formData.apiKey}
                >
                  <RefreshCw size={14} className={testing ? 'spin' : ''} />
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

                {firebaseState.isConnected && (
                  <button
                    type="button"
                    className="btn btn-outline-gold"
                    onClick={triggerSyncToFirestore}
                    disabled={syncing}
                  >
                    <RefreshCw size={14} className={syncing ? 'spin' : ''} />
                    {syncing ? 'Syncing...' : 'Upload Local Data to Cloud'}
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Connecting...' : 'Save & Connect Firebase'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Rules */}
      {activeTab === 'rules' && (
        <div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            In Firebase Console &gt; <strong>Firestore Database</strong> &gt; <strong>Rules</strong> tab, paste this configuration so your app has permission to write DOFU collections:
          </p>
          <div style={{ position: 'relative' }}>
            <pre
              style={{
                background: '#090b0e',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '18px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: '#e5c07b',
                overflowX: 'auto',
                lineHeight: 1.6
              }}
            >
              {FIRESTORE_RULES}
            </pre>
            <button
              className="btn btn-secondary btn-sm"
              style={{ position: 'absolute', top: 12, right: 12 }}
              onClick={() => copyToClipboard(FIRESTORE_RULES, 'Firestore Rules')}
            >
              <Copy size={14} />
              Copy Rules
            </button>
          </div>
        </div>
      )}

      {/* Tab: Guide */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {FIREBASE_SETUP_STEPS.map((s) => (
            <div
              key={s.step}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--gold-subtle)',
                  color: 'var(--gold-light)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {s.step}
              </div>
              <div>
                <h4 style={{ color: '#fff', fontSize: '0.92rem', marginBottom: '4px' }}>
                  {s.title}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};
