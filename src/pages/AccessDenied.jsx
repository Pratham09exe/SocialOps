import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AccessDenied({ requiredRoles = [] }) {
  const navigate = useNavigate();
  const { activeRole } = useAuth();

  return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 32px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-modal)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--danger-subtle)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
          border: '1px solid var(--danger-border)'
        }}>
          <ShieldAlert size={28} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Access Denied (403 Forbidden)
        </h2>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
          Your authenticated role (<strong>{activeRole.toUpperCase()}</strong>) does not have authorization to access this administrative module.
        </p>

        {requiredRoles.length > 0 && (
          <div style={{
            fontSize: '11.5px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-subtle)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)'
          }}>
            Authorized roles: {requiredRoles.map(r => r.toUpperCase()).join(', ')}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft size={14} />
            <span>Go Back</span>
          </button>
          <button onClick={() => navigate('/')} className="btn-primary">
            <Home size={14} />
            <span>Return to My Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

