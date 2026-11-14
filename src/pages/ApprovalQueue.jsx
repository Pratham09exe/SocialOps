import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Download,
  Filter,
  Check,
  X,
  FileCheck,
  MessageSquare
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import GoogleDriveLink from '../components/common/GoogleDriveLink';
import EmptyState from '../components/common/EmptyState';

export default function ApprovalQueue() {
  const { approvals, reviewApprovalItem, complianceLogs } = useAppData();
  const { activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState('All Pending');
  const [selectedItems, setSelectedItems] = useState([]);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [modalMode, setModalMode] = useState('signoff'); // 'signoff' or 'revision'
  const [feedbackNote, setFeedbackNote] = useState('');

  // Filter based on active tab
  const filteredApprovals = approvals.filter((item) => {
    if (activeTab === 'All Pending') return item.status !== 'Approved';
    if (activeTab === 'Needs Internal Review') return item.status === 'Needs Internal Review';
    if (activeTab === 'Client Review Required') return item.status === 'Client Review Required';
    if (activeTab === 'Urgent Changes Requested') return item.status === 'Urgent Changes Requested';
    if (activeTab === 'Approved') return item.status === 'Approved';
    return true;
  });

  const handleOpenReview = (item, mode) => {
    setActiveModalItem(item);
    setModalMode(mode);
    setFeedbackNote(item.feedback || '');
  };

  const handleConfirmReview = (decision) => {
    if (!activeModalItem) return;
    reviewApprovalItem(activeModalItem.id, decision, feedbackNote);
    setActiveModalItem(null);
    setFeedbackNote('');
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredApprovals.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredApprovals.map(a => a.id));
    }
  };

  const handleBatchApprove = () => {
    selectedItems.forEach(id => {
      reviewApprovalItem(id, 'Approved', 'Batch verified by authorized user');
    });
    setSelectedItems([]);
  };

  const tabs = [
    { label: 'All Pending', count: approvals.filter(a => a.status !== 'Approved').length },
    { label: 'Client Review Required', count: approvals.filter(a => a.status === 'Client Review Required').length },
    { label: 'Needs Internal Review', count: approvals.filter(a => a.status === 'Needs Internal Review').length },
    { label: 'Urgent Changes Requested', count: approvals.filter(a => a.status === 'Urgent Changes Requested').length },
    { label: 'Approved', count: approvals.filter(a => a.status === 'Approved').length },
  ];

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Deliverable Review & Approval Queue"
        description="Inspect staged cloud proofs, verify brand compliance, and authorize creative assets for publishing."
        badge={`${approvals.filter(a => a.status !== 'Approved').length} in Queue`}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedItems.length > 0 && (
              <button
                onClick={handleBatchApprove}
                className="btn-primary"
                style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
              >
                <Check size={14} />
                <span>Authorize Selected ({selectedItems.length})</span>
              </button>
            )}
          </div>
        }
      />

      {/* Tabs Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  marginBottom: '-1px',
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap',
                  background: 'none'
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isActive ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: 600
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Multi-select control */}
        {filteredApprovals.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="btn-ghost"
            style={{ fontSize: '12px' }}
          >
            {selectedItems.length === filteredApprovals.length ? 'Deselect All' : `Select All (${filteredApprovals.length})`}
          </button>
        )}
      </div>

      {/* Approvals Grid */}
      {filteredApprovals.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No deliverables in this review stage"
          description="There are currently no creative assets matching this queue filter."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {filteredApprovals.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            const isApproved = item.status === 'Approved';

            return (
              <div
                key={item.id}
                className="bento-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  boxShadow: isSelected ? '0 0 0 1px var(--accent-primary)' : 'var(--shadow-card)',
                  gap: '14px'
                }}
              >
                {/* Header Row: Checkbox, Client, Format, Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedItems(selectedItems.filter(id => id !== item.id));
                        } else {
                          setSelectedItems([...selectedItems, item.id]);
                        }
                      }}
                      style={{ accentColor: 'var(--accent-primary)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.client}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                      {item.format}
                    </span>
                  </div>

                  <span className={`badge ${
                    item.status === 'Approved' ? 'badge-success' :
                    item.status === 'Urgent Changes Requested' ? 'badge-danger' :
                    item.status === 'Client Review Required' ? 'badge-warning' : 'badge-primary'
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Content Details: Thumbnail + Title + Caption */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    flexShrink: 0
                  }}>
                    <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {item.title}
                    </h4>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.caption || 'No caption provided.'}
                    </p>
                  </div>
                </div>

                {/* Feedback Note if present */}
                {item.feedback && (
                  <div style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    borderLeft: '3px solid var(--warning)',
                    fontSize: '11.5px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <MessageSquare size={13} color="var(--warning)" />
                    <span><strong>Feedback:</strong> {item.feedback}</span>
                  </div>
                )}

                {/* Proof Link + Compliance Hash (Admin only) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-subtle)',
                  fontSize: '11.5px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <GoogleDriveLink url={item.driveUrl} compact />
                  {activeRole === 'admin' && (
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={13} color="var(--success)" />
                      <span>Hash: {item.complianceHash ? item.complianceHash.substring(0, 8) : 'Verified'}</span>
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                {!isApproved && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleOpenReview(item, 'revision')}
                      className="btn-secondary"
                      style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)', fontSize: '12.5px' }}
                    >
                      <X size={14} />
                      <span>Request Changes</span>
                    </button>
                    <button
                      onClick={() => handleOpenReview(item, 'signoff')}
                      className="btn-primary"
                      style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)', fontSize: '12.5px' }}
                    >
                      <Check size={14} />
                      <span>Authorize Sign-Off</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal (Sign-Off or Request Changes) */}
      {activeModalItem && (
        <Modal
          isOpen={Boolean(activeModalItem)}
          onClose={() => setActiveModalItem(null)}
          title={modalMode === 'signoff' ? "Authorize Deliverable Sign-Off" : "Request Creative Changes"}
          subtitle={`Deliverable: ${activeModalItem.title} (${activeModalItem.client})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: modalMode === 'signoff' ? 'var(--success-subtle)' : 'var(--danger-subtle)',
              border: `1px solid ${modalMode === 'signoff' ? 'var(--success-border)' : 'var(--danger-border)'}`
            }}>
              <p style={{
                fontSize: '13px',
                color: modalMode === 'signoff' ? 'var(--success-text)' : 'var(--danger-text)',
                fontWeight: 500
              }}>
                {modalMode === 'signoff'
                  ? "Authorizing this deliverable marks it verified for client publishing and creates an immutable sign-off log."
                  : "Requesting changes will flag this deliverable for immediate revision by the creative staff."}
              </p>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">
                {modalMode === 'signoff' ? "Sign-off Notes (Optional)" : "Revision Instructions & Feedback (Required)"}
              </label>
              <textarea
                rows={3}
                required={modalMode === 'revision'}
                placeholder={modalMode === 'signoff' ? "Asset adheres to brand guidelines..." : "Adjust thumbnail color balance, trim beginning by 2 seconds..."}
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                className="saas-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReview(modalMode === 'signoff' ? 'Approved' : 'Urgent Changes Requested')}
                className="btn-primary"
                style={{
                  backgroundColor: modalMode === 'signoff' ? 'var(--success)' : 'var(--danger)',
                  borderColor: modalMode === 'signoff' ? 'var(--success)' : 'var(--danger)'
                }}
              >
                {modalMode === 'signoff' ? "Confirm Sign-Off" : "Submit Change Request"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
