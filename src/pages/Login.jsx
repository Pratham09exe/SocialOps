import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateGmail = (inputEmail) => {
    const cleaned = (inputEmail || '').trim().toLowerCase();
    if (!cleaned) {
      return 'Email address is required.';
    }
    if (!cleaned.endsWith('@gmail.com')) {
      return 'Only @gmail.com email addresses are permitted. Please enter a valid Gmail address (e.g. user@gmail.com).';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Frontend Gmail domain validation
    const validationError = validateGmail(email);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      setIsLoading(false);
      navigate('/');
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication failed. Please verify your Gmail address and password.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-base)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle Background Glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-primary-glow) 0%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(60px)'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-modal)',
        padding: '36px 32px',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeIn 0.25s ease-out'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/logo.png"
            alt="SocialOps Logo"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.28)'
            }}
          />
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            SocialOps
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Next-Generation Agency Operating System
          </p>
        </div>

        {/* Security / Gmail Notice */}
        <div
          data-testid="gmail-auth-notice"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--accent-primary-subtle)',
            border: '1px solid var(--accent-primary-border)',
            marginBottom: '20px'
          }}
        >
          <ShieldCheck size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
            <strong>Gmail Authentication:</strong> Enter your registered @gmail.com account credentials to access your dashboard.
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            data-testid="login-error-alert"
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger-text)',
              fontSize: '12.5px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}
          >
            <AlertCircle size={15} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="login-form">
          <div className="saas-form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="email" className="saas-label">
              Gmail Address <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email"
                name="email"
                data-testid="email-input"
                aria-label="Gmail Address"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="saas-input"
                style={{ paddingLeft: '38px' }}
                placeholder="yourname@gmail.com"
                autoComplete="email"
              />
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Only @gmail.com domains are accepted
            </span>
          </div>

          <div className="saas-form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" className="saas-label" style={{ marginBottom: 0 }}>Password <span style={{ color: 'var(--danger)' }}>*</span></label>
              <a href="#forgot" style={{ fontSize: '11.5px', color: 'var(--accent-primary)', fontWeight: 500 }}>
                Forgot password?
              </a>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                data-testid="password-input"
                aria-label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                className="saas-input"
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }} htmlFor="remember-device">
              <input
                id="remember-device"
                name="remember-device"
                data-testid="remember-device-checkbox"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 15, height: 15, cursor: 'pointer' }}
              />
              <span>Remember this device for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            data-testid="login-submit-btn"
            aria-label="Sign in to SocialOps"
            disabled={isLoading}
            className="btn-primary"
            style={{
              padding: '12px',
              fontSize: '14px',
              width: '100%',
              marginTop: '6px',
              borderRadius: 'var(--radius-md)'
            }}
          >
            {isLoading ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Sign in to SocialOps</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          SocialOps Enterprise Cloud • Role-Enforced Security
        </div>
      </div>
    </div>
  );
}
