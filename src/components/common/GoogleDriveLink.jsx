import React from 'react';
import { ExternalLink, HardDrive } from 'lucide-react';

export default function GoogleDriveLink({
  url,
  label = "Inspect Cloud Asset Proof",
  compact = false
}) {
  if (!url) {
    return (
      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        No cloud link provided
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: compact ? '5px' : '7px',
        padding: compact ? '4px 9px' : '6px 12px',
        backgroundColor: 'var(--accent-blue-subtle)',
        color: 'var(--accent-blue)',
        border: '1px solid rgba(2, 132, 199, 0.25)',
        borderRadius: '8px',
        fontSize: compact ? '11px' : '12px',
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all 0.15s ease'
      }}
      title={`Open deliverable assets at ${url}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <HardDrive size={compact ? 12 : 14} />
      <span>{label}</span>
      <ExternalLink size={compact ? 11 : 13} />
    </a>
  );
}
