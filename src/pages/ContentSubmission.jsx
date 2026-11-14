import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { SOCIAL_PLATFORMS } from '../constants/platforms';
import {
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  HardDrive,
  Send,
  AlertCircle,
  FileCheck,
  Eye,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import GoogleDriveLink from '../components/common/GoogleDriveLink';

export default function ContentSubmission() {
  const { clients, submitContentDeliverable } = useAppData();

  const [storagePlatform, setStoragePlatform] = useState('Google Drive');
  const [driveUrl, setDriveUrl] = useState('');
  const [client, setClient] = useState(clients[0]?.name || clients[0]?.business_name || 'Apex Kinetic');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [selectedFormat, setSelectedFormat] = useState('Reel 9:16');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(null);

  const storageOptions = [
    { name: 'Google Drive', icon: '📁' },
    { name: 'Dropbox', icon: '📦' },
    { name: 'OneDrive', icon: '☁️' },
    { name: 'Frame.io', icon: '🎬' }
  ];

  const handlePlatformChange = (pId) => {
    setSelectedPlatform(pId);
    const pMeta = SOCIAL_PLATFORMS.find(p => p.id === pId);
    if (pMeta && pMeta.formats.length > 0) {
      setSelectedFormat(pMeta.formats[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!driveUrl) {
      alert('Please enter a valid Google Drive or cloud asset URL.');
      return;
    }

    const pMeta = SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform);
    const platformLabel = pMeta ? pMeta.shortName : 'Instagram';

    const subId = submitContentDeliverable({
      storagePlatform,
      driveUrl,
      client,
      platform: selectedPlatform,
      targetFormat: selectedFormat,
      targetPlatform: `${platformLabel} ${selectedFormat}`,
      caption,
      hashtags,
      internalNotes
    });

    setSubmittedSuccess(subId);
    setDriveUrl('');
    setCaption('');
    setHashtags('');
    setInternalNotes('');

    setTimeout(() => {
      setSubmittedSuccess(null);
    }, 6000);
  };

  const currentPlatformMeta = SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform) || SOCIAL_PLATFORMS[0];

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Submit Creative Deliverable"
        description="Stage completed creative deliverables with external Google Drive proof links directly into the review queue."
        badge="Asset Staging Hub"
      />

      {submittedSuccess && (
        <div style={{
          backgroundColor: 'var(--success-subtle)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={20} color="var(--success)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--success-text)', fontSize: '14px' }}>
              Deliverable #{submittedSuccess} staged successfully into Approval Queue!
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--success-text)', marginTop: '2px', opacity: 0.85 }}>
              Client and account leads have been notified for immediate proof review.
            </div>
          </div>
        </div>
      )}

      {/* Dual Pane Layout: Left Form + Right Live Deliverable Preview */}
      <div className="bento-grid">
        {/* Left Form Column (7 cols) */}
        <div className="bento-col-8">
          <div className="bento-card" style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Cloud Storage Selector */}
              <div>
                <label className="saas-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Cloud Storage Provider
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {storageOptions.map(p => {
                    const isSelected = storagePlatform === p.name;
                    return (
                      <button
                        type="button"
                        key={p.name}
                        onClick={() => setStoragePlatform(p.name)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'var(--accent-primary-subtle)' : 'var(--bg-surface)',
                          color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontWeight: 600,
                          fontSize: '12.5px',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Google Drive URL Input */}
              <div className="saas-form-group">
                <label className="saas-label">
                  Google Drive Proof URL <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className="saas-input"
                    style={{ paddingLeft: '36px' }}
                  />
                  <LinkIcon size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Paste the shareable link with "Anyone with the link can view" permissions.
                </span>
              </div>

              {/* Client & Platform Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="saas-form-group">
                  <label className="saas-label">Target Client Brand</label>
                  <select
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className="saas-input"
                  >
                    {clients.map(c => (
                      <option key={c.id || c.account_id} value={c.name || c.business_name}>
                        {c.name || c.business_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="saas-form-group">
                  <label className="saas-label">Target Social Platform</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
                    className="saas-input"
                  >
                    {SOCIAL_PLATFORMS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Format Selector Pills */}
              <div>
                <label className="saas-label" style={{ marginBottom: '8px', display: 'block' }}>
                  Deliverable Format ({currentPlatformMeta.name})
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {currentPlatformMeta.formats.map((fmt) => {
                    const isFmtSelected = selectedFormat === fmt;
                    return (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => setSelectedFormat(fmt)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '12px',
                          fontWeight: isFmtSelected ? 600 : 500,
                          backgroundColor: isFmtSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                          color: isFmtSelected ? '#FFFFFF' : 'var(--text-secondary)',
                          border: isFmtSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caption / Copy */}
              <div className="saas-form-group">
                <label className="saas-label">Deliverable Copy & Caption</label>
                <textarea
                  rows={3}
                  placeholder="Enter finalized copy, hook, or video script notes..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="saas-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Hashtags */}
              <div className="saas-form-group">
                <label className="saas-label">Hashtags & Distribution Tags</label>
                <input
                  type="text"
                  placeholder="#brand #productdrop #marketing"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="saas-input"
                />
              </div>

              {/* Internal Notes */}
              <div className="saas-form-group">
                <label className="saas-label">Internal Team Context & Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Notes for account executives or client reviewer..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="saas-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '10px 24px', fontSize: '14px' }}
                >
                  <UploadCloud size={16} />
                  <span>Stage Deliverable for Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Preview Column (4 cols) */}
        <div className="bento-col-4">
          <div className="bento-card" style={{ position: 'sticky', top: '90px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} color="var(--accent-primary)" />
                <span>Live Portal Preview</span>
              </h4>
              <span className="badge badge-primary">Client View</span>
            </div>

            {/* Mock Deliverable Card as it appears to clients */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-subtle)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: currentPlatformMeta.color }} />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{client}</span>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>{selectedFormat}</span>
              </div>

              {/* Asset Box */}
              <div style={{
                height: '140px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px dashed var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                {driveUrl ? (
                  <>
                    <CheckCircle2 size={24} color="var(--success)" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Cloud Proof Attached</span>
                    <GoogleDriveLink url={driveUrl} compact />
                  </>
                ) : (
                  <>
                    <HardDrive size={24} color="var(--text-muted)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter Drive URL to preview</span>
                  </>
                )}
              </div>

              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {caption ? caption.substring(0, 70) + (caption.length > 70 ? '...' : '') : 'Your deliverable caption will preview here...'}
                </div>
                {hashtags && (
                  <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '4px' }}>
                    {hashtags}
                  </div>
                )}
              </div>

              <div style={{
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}>
                <span>Storage: {storagePlatform}</span>
                <span>Stage: Ready for QA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
