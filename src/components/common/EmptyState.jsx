import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = "No items found",
  description = "There are no records matching your criteria.",
  action = null
}) {
  return (
    <div
      style={{
        padding: '56px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        border: '1px dashed var(--border-subtle)',
        width: '100%'
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: 'var(--text-muted)'
        }}
      >
        <Icon size={26} />
      </div>
      <h4
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '6px'
        }}
      >
        {title}
      </h4>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          maxWidth: '420px',
          lineHeight: 1.5
        }}
      >
        {description}
      </p>
      {action && <div style={{ marginTop: '18px' }}>{action}</div>}
    </div>
  );
}
