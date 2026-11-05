import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  Zap,
  WifiOff,
  Layers,
  ArrowRight
} from 'lucide-react';

export const InstallAppModal = () => {
  const {
    installModalOpen,
    setInstallModalOpen,
    isStandalone,
    isIOS,
    deferredInstallPrompt,
    triggerInstallApp
  } = useApp();

  if (!installModalOpen) return null;

  return (
    <Modal
      isOpen={installModalOpen}
      onClose={() => setInstallModalOpen(false)}
      title="Install DOFU as App on Your Device"
      size="md"
      footer={
        <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setInstallModalOpen(false)}>
            Close
          </button>
          {!isStandalone && deferredInstallPrompt && (
            <button className="btn btn-primary" onClick={triggerInstallApp}>
              <Download size={16} />
              <span>Install App Now</span>
            </button>
          )}
        </div>
      }
    >
      <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
        {/* App Icon Preview */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '20px',
              padding: '6px',
              background: 'linear-gradient(135deg, rgba(197, 160, 89, 0.4) 0%, rgba(20, 24, 32, 0.9) 100%)',
              border: '2px solid var(--gold-primary)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(197, 160, 89, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}
          >
            <img
              src="/logo.png"
              alt="DOFU Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '14px' }}
            />
          </div>
          <span
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              background: 'var(--gold-primary)',
              color: '#000',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}
          >
            <Sparkles size={13} />
          </span>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.35rem',
            color: 'var(--text-main)',
            margin: '0 0 6px'
          }}
        >
          DOFU Furniture & Interior Design
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {isStandalone
            ? 'DOFU System is already installed and running as a native app on this device.'
            : 'Add DOFU directly to your home screen or desktop to open it with one tap without opening a browser.'}
        </p>

        {/* If Already Installed */}
        {isStandalone ? (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}
          >
            <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#10b981', fontSize: '0.92rem', display: 'block' }}>
                App Already Installed ✓
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                You are currently running the official standalone DOFU app with offline caching and hardware acceleration enabled.
              </span>
            </div>
          </div>
        ) : isIOS ? (
          /* iOS Safari Specific Step-by-Step Instructions */
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '18px',
              textAlign: 'left'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--gold-primary)',
                fontWeight: 700,
                fontSize: '0.86rem',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              <Smartphone size={16} />
              <span>iPhone & iPad Instructions (Safari)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(197, 160, 89, 0.2)',
                    color: 'var(--gold-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  1
                </span>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  Tap the <strong>Share button</strong> in Safari{' '}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      color: '#60a5fa',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}
                  >
                    <Share2 size={13} style={{ marginRight: '4px' }} /> Share
                  </span>{' '}
                  at the bottom of your screen (or top on iPad).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(197, 160, 89, 0.2)',
                    color: 'var(--gold-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  2
                </span>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  Scroll down the menu and tap{' '}
                  <strong style={{ color: 'var(--gold-light)' }}>
                    <PlusSquare size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />
                    Add to Home Screen
                  </strong>{' '}
                  <em>(Ongeza kwenye Skrini ya Mwanzo)</em>.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'rgba(197, 160, 89, 0.2)',
                    color: 'var(--gold-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  3
                </span>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  Tap <strong>Add</strong> in the top-right corner. The <strong>DOFU System</strong> icon will appear on your iPhone home screen just like an App Store app!
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Android / Chrome / Edge / Windows / Mac */
          <div>
            {deferredInstallPrompt ? (
              <div style={{ marginBottom: '18px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={triggerInstallApp}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    fontSize: '1rem',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(197, 160, 89, 0.35)'
                  }}
                >
                  <Download size={20} />
                  <span>Install DOFU App on This Device</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              /* Fallback for Android Chrome menu / Edge */
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '16px',
                  textAlign: 'left',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--gold-light)', fontSize: '0.88rem', marginBottom: '8px' }}>
                  Quick Installation Steps:
                </div>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <li>Tap the browser menu <strong>(three dots ⋮)</strong> in the top-right corner.</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Tap <strong>Install</strong> to confirm. DOFU will be added to your home screen!</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Benefits Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            textAlign: 'left'
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.82rem' }}>
              <Zap size={14} />
              <span>Instant Launch</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Opens in 0.5s directly from your home screen without browser tabs.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, fontSize: '0.82rem' }}>
              <WifiOff size={14} />
              <span>Offline Ready</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Look up client specs and receipts even with slow or unstable internet.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontWeight: 600, fontSize: '0.82rem' }}>
              <Layers size={14} />
              <span>Full Screen App</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Clean, distraction-free interface matching your device's theme.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
