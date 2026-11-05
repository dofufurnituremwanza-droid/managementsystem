import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Smartphone, Download } from 'lucide-react';

export const LoginView = () => {
  const { login, isStandalone, triggerInstallApp } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) {
        setError(result.message);
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div
      className="login-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, rgba(197, 160, 89, 0.08) 0%, #0c0e12 70%)',
        padding: '20px',
        position: 'relative'
      }}
    >
      {/* Background Decorative Rings */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          border: '1px solid rgba(197, 160, 89, 0.05)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '750px',
          height: '750px',
          borderRadius: '50%',
          border: '1px solid rgba(197, 160, 89, 0.03)',
          pointerEvents: 'none'
        }}
      />

      <div
        className="login-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(20, 24, 32, 0.88)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(197, 160, 89, 0.28)',
          borderRadius: '24px',
          padding: '40px 36px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(197, 160, 89, 0.08)',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img
            src="/logo.png"
            alt="DOFU Logo"
            style={{
              width: '72px',
              height: '72px',
              objectFit: 'contain',
              borderRadius: '16px',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
            }}
          />
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.75rem',
              color: '#fff',
              letterSpacing: '0.04em',
              marginBottom: '6px'
            }}
          >
            DOFU
          </h1>
          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--gold-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontWeight: 700
            }}
          >
            Furniture & Interior Design
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Staff & Management System Access
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.84rem',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} color="var(--gold-primary)" />
              <span>Username / Staff ID</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              className="form-input"
              placeholder="e.g. DOFU or Assistant Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                fontSize: '0.95rem',
                padding: '12px 14px',
                background: 'rgba(15, 18, 25, 0.8)'
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={13} color="var(--gold-primary)" />
              <span>Security Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '0.95rem',
                  padding: '12px 42px 12px 14px',
                  background: 'rgba(15, 18, 25, 0.8)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                aria-label="Toggle password view"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to DOFU'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Option to Add / Install DOFU as Native App on Device */}
        {!isStandalone && (
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-outline-gold btn-sm"
              onClick={triggerInstallApp}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '10px 14px',
                borderRadius: '10px',
                borderStyle: 'dashed'
              }}
              title="Add DOFU System as an app to your phone or computer"
            >
              <Smartphone size={16} />
              <span>Install App on this Device</span>
            </button>
          </div>
        )}

        {/* Footer info badge */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.76rem',
            color: 'var(--text-muted)'
          }}
        >
          <ShieldCheck size={15} color="var(--gold-primary)" />
          <span>Encrypted Staff Portal • DOFU Design</span>
        </div>
      </div>
    </div>
  );
};
