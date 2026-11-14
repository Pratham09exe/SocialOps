import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  User,
  Calendar,
  Send,
  Eye,
  Check,
  X,
  Share2,
  Layers,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import GoogleDriveLink from '../components/common/GoogleDriveLink';
import {
  SOCIAL_PLATFORMS,
  CONTENT_CATEGORIES,
  INDUSTRY_OPTIONS,
  CTA_OPTIONS,
  REQUEST_STATUSES,
  getPlatformMeta
} from '../constants/platforms';

export default function ContentRequests() {
  const {
    contentRequests,
    createContentRequest,
    assignContentRequest,
    updateContentRequestStatus,
    submitContentForRequest,
    reviewContentRequest,
    clients,
    employees
  } = useAppData();

  const { user, activeRole } = useAuth();

  const [activeTab, setActiveTab] = useState('All Requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('All');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState('All');

  // Modals state
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
  const [assignModalRequest, setAssignModalRequest] = useState(null);
  const [assignedEmployeeName, setAssignedEmployeeName] = useState(employees[0]?.name || 'Sahil Mahale');
  const [submitDeliverableModalRequest, setSubmitDeliverableModalRequest] = useState(null);
  const [clientReviewModalRequest, setClientReviewModalRequest] = useState(null);

  // New Request Form State (Sections A through H)
  const [reqTitle, setReqTitle] = useState('');
  const [reqClient, setReqClient] = useState(clients[0]?.name || clients[0]?.business_name || 'Chakankar Digital Innovations');
  const [reqIndustry, setReqIndustry] = useState(INDUSTRY_OPTIONS[0]);
  const [reqProductOrService, setReqProductOrService] = useState('');
  const [reqTopic, setReqTopic] = useState('');
  const [reqObjective, setReqObjective] = useState('');
  const [reqMainMessage, setReqMainMessage] = useState('');
  const [reqDetailedInstructions, setReqDetailedInstructions] = useState('');
  const [reqCategories, setReqCategories] = useState(['Product Showcase']);
  const [reqPlatforms, setReqPlatforms] = useState(['instagram']);
  const [reqFormats, setReqFormats] = useState(['Reel']);
  const [reqAudienceType, setReqAudienceType] = useState('Urban Professionals & Creators');
  const [reqTargetAge, setReqTargetAge] = useState('22-45');
  const [reqTargetLocation, setReqTargetLocation] = useState('Global Tier 1');
  const [reqLanguage, setReqLanguage] = useState('English');
  const [reqDesignStyle, setReqDesignStyle] = useState('Modern Minimalist');
  const [reqToneOfVoice, setReqToneOfVoice] = useState('Premium & Confident');
  const [reqBrandColors, setReqBrandColors] = useState('#0F172A, #4F46E5');
  const [reqReferenceUrl, setReqReferenceUrl] = useState('');
  const [reqAdditionalInstructions, setReqAdditionalInstructions] = useState('');
  const [reqCTA, setReqCTA] = useState('Visit Website');
  const [reqDeadline, setReqDeadline] = useState('2026-11-28');
  const [reqDeadlineNotes, setReqDeadlineNotes] = useState('');

  // Submit Deliverable Form State (Employee)
  const [submitDriveUrl, setSubmitDriveUrl] = useState('');
  const [submitAssetDesc, setSubmitAssetDesc] = useState('');
  const [submitPlatform, setSubmitPlatform] = useState('instagram');
  const [submitFormat, setSubmitFormat] = useState('Reel');
  const [submitUrlError, setSubmitUrlError] = useState('');

  // Client Review Form State (Client)
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewMode, setReviewMode] = useState('approve'); // 'approve' | 'revision'

  // Filter requests based on user role and filters
  const filteredRequests = contentRequests.filter((req) => {
    // Role based scoping: Clients only see their brand's requests
    if (activeRole === 'client') {
      const clientName = (user?.name || '').toLowerCase();
      const isClientMatch = (req.client || '').toLowerCase().includes(clientName) ||
        clientName.includes((req.client || '').toLowerCase());
      if (!isClientMatch) return false;
    }

    // Role based scoping: Employees see assigned requests when in staff view if filtered
    if (activeRole === 'employee' && activeTab === 'My Assigned') {
      const empName = (user?.name || 'Sahil Mahale').toLowerCase();
      if (!req.assignedEmployee || !req.assignedEmployee.toLowerCase().includes(empName)) return false;
    }

    // Status Tab filter
    if (activeTab === 'Submitted' && req.status !== 'Submitted') return false;
    if (activeTab === 'In Progress' && req.status !== 'In Progress' && req.status !== 'Assigned') return false;
    if (activeTab === 'Needs Signoff' && req.status !== 'Submitted for Approval') return false;
    if (activeTab === 'Changes Req.' && req.status !== 'Changes Requested') return false;
    if (activeTab === 'Approved' && req.status !== 'Approved') return false;

    // Client dropdown filter
    if (selectedClientFilter !== 'All' && req.client !== selectedClientFilter) return false;

    // Platform dropdown filter
    if (selectedPlatformFilter !== 'All' && !(req.platforms || []).includes(selectedPlatformFilter)) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (req.title || '').toLowerCase().includes(q);
      const matchClient = (req.client || '').toLowerCase().includes(q);
      const matchTopic = (req.contentTopic || '').toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchTopic) return false;
    }

    return true;
  });

  // Category toggle helper
  const toggleCategory = (cat) => {
    if (reqCategories.includes(cat)) {
      if (reqCategories.length > 1) {
        setReqCategories(reqCategories.filter(c => c !== cat));
      }
    } else {
      setReqCategories([...reqCategories, cat]);
    }
  };

  // Platform toggle helper
  const togglePlatform = (pId) => {
    if (reqPlatforms.includes(pId)) {
      if (reqPlatforms.length > 1) {
        setReqPlatforms(reqPlatforms.filter(p => p !== pId));
      }
    } else {
      setReqPlatforms([...reqPlatforms, pId]);
    }
  };

  // Format toggle helper
  const toggleFormat = (fmt) => {
    if (reqFormats.includes(fmt)) {
      if (reqFormats.length > 1) {
        setReqFormats(reqFormats.filter(f => f !== fmt));
      }
    } else {
      setReqFormats([...reqFormats, fmt]);
    }
  };

  // Handle Create Request Submit
  const handleCreateRequestSubmit = (e) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    createContentRequest({
      title: reqTitle.trim(),
      client: reqClient,
      industry: reqIndustry,
      productOrService: reqProductOrService,
      contentTopic: reqTopic,
      contentObjective: reqObjective,
      mainMessage: reqMainMessage,
      detailedInstructions: reqDetailedInstructions,
      categories: reqCategories,
      platforms: reqPlatforms,
      formats: reqFormats,
      audienceType: reqAudienceType,
      targetAgeGroup: reqTargetAge,
      targetLocation: reqTargetLocation,
      preferredLanguage: reqLanguage,
      designStyle: reqDesignStyle,
      toneOfVoice: reqToneOfVoice,
      brandColors: reqBrandColors,
      referenceUrl: reqReferenceUrl,
      additionalInstructions: reqAdditionalInstructions,
      callToAction: reqCTA,
      submissionDeadline: reqDeadline,
      deadlineInstructions: reqDeadlineNotes
    });

    setIsNewRequestModalOpen(false);
    setReqTitle('');
    setReqTopic('');
    setReqMainMessage('');
    setReqDetailedInstructions('');
  };

  // Handle Admin Assign Employee
  const handleConfirmAssignment = (e) => {
    e.preventDefault();
    if (!assignModalRequest) return;
    assignContentRequest(assignModalRequest.id, assignedEmployeeName);
    setAssignModalRequest(null);
  };

  // Handle Employee Submit Deliverable
  const handleConfirmDeliverableSubmission = (e) => {
    e.preventDefault();
    if (!submitDriveUrl) {
      setSubmitUrlError('Please enter a Google Drive link.');
      return;
    }

    // Validate HTTPS format
    if (!submitDriveUrl.startsWith('https://')) {
      setSubmitUrlError('Google Drive URL must begin with secure https://');
      return;
    }

    setSubmitUrlError('');
    submitContentForRequest(submitDeliverableModalRequest.id, {
      googleDriveUrl: submitDriveUrl,
      deliveredAssetDescription: submitAssetDesc || 'Completed creative deliverable staged for client approval.',
      platform: submitPlatform,
      format: submitFormat
    });

    setSubmitDeliverableModalRequest(null);
    setSubmitDriveUrl('');
    setSubmitAssetDesc('');
  };

  // Handle Client Review (Approve or Request Changes)
  const handleConfirmClientReview = (decision) => {
    if (!clientReviewModalRequest) return;
    reviewContentRequest(clientReviewModalRequest.id, decision, reviewFeedback);
    setClientReviewModalRequest(null);
    setReviewFeedback('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'badge-success';
      case 'Submitted for Approval':
        return 'badge-warning';
      case 'Changes Requested':
        return 'badge-danger';
      case 'In Progress':
      case 'Assigned':
        return 'badge-primary';
      default:
        return 'badge-neutral';
    }
  };

  // Available formats combined across selected platforms for creation form
  const availableFormatsForSelectedPlatforms = Array.from(
    new Set(
      reqPlatforms.flatMap(pId => {
        const meta = getPlatformMeta(pId);
        return meta ? meta.formats : [];
      })
    )
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Content Requirements & Creative Briefs"
        description="End-to-end client brief intake, administrative employee assignments, and iterative proof approvals."
        badge={`${filteredRequests.length} Active Requests`}
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setIsNewRequestModalOpen(true)} className="btn-primary">
              <Plus size={15} />
              <span>New Content Request</span>
            </button>
          </div>
        }
      />

      {/* KPI Overview Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Briefs</span>
            <div className="kpi-icon-box">
              <FileText size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{contentRequests.length}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>briefs</span>
          </div>
          <span className="kpi-subtitle">Managed across creative pipeline</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">In Production</span>
            <div className="kpi-icon-box" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{contentRequests.filter(r => r.status === 'In Progress' || r.status === 'Assigned').length}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>active</span>
          </div>
          <span className="kpi-subtitle">Being produced by creative operatives</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Sign-Off</span>
            <div className="kpi-icon-box" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
              <Eye size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{contentRequests.filter(r => r.status === 'Submitted for Approval').length}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>staged</span>
          </div>
          <span className="kpi-subtitle">Google Drive proofs awaiting client review</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Approved Deliverables</span>
            <div className="kpi-icon-box" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{contentRequests.filter(r => r.status === 'Approved' || r.status === 'Completed').length}</span>
          </div>
          <span className="kpi-subtitle">Verified & authorized for publishing</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bento-card" style={{ padding: '14px 18px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-subtle)',
              padding: '7px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              width: '240px'
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search briefs or brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '12.5px', width: '100%', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Client Filter (Admin/Employee) */}
            {activeRole !== 'client' && (
              <select
                value={selectedClientFilter}
                onChange={(e) => setSelectedClientFilter(e.target.value)}
                className="saas-input"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
              >
                <option value="All">All Clients</option>
                {clients.map(c => (
                  <option key={c.id || c.account_id} value={c.name || c.business_name}>
                    {c.name || c.business_name}
                  </option>
                ))}
              </select>
            )}

            {/* Platform Filter */}
            <select
              value={selectedPlatformFilter}
              onChange={(e) => setSelectedPlatformFilter(e.target.value)}
              className="saas-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
              <option value="All">All Platforms</option>
              {SOCIAL_PLATFORMS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Tab Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {['All Requests', activeRole === 'employee' ? 'My Assigned' : null, 'Submitted', 'In Progress', 'Needs Signoff', 'Changes Req.', 'Approved'].filter(Boolean).map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-fast)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Requests Grid */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No content requests found"
          description="Submit a new content brief or try adjusting your active filters."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {filteredRequests.map((req) => {
            const hasDriveLink = Boolean(req.googleDriveUrl);
            const isChangesRequested = req.status === 'Changes Requested';

            return (
              <div
                key={req.id}
                className="bento-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '22px',
                  gap: '16px'
                }}
              >
                {/* Header: ID, Client, Industry, Status */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', backgroundColor: 'var(--accent-primary-subtle)', padding: '2px 7px', borderRadius: 'var(--radius-sm)' }}>
                        {req.id}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {req.client}
                      </span>
                    </div>

                    <span className={`badge ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>

                  {/* Title & Topic */}
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '4px' }}>
                    {req.title}
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    <strong>Topic:</strong> {req.contentTopic || 'Brand storytelling'} • <strong>Objective:</strong> {req.contentObjective || 'Engagement'}
                  </p>
                </div>

                {/* Platforms & Categories */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Platforms:</span>
                    {(req.platforms || ['instagram']).map((pId) => {
                      const pMeta = getPlatformMeta(pId);
                      return (
                        <span key={pId} className="platform-pill" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: pMeta.color }} />
                          {pMeta.shortName}
                        </span>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Categories:</span>
                    {(req.categories || []).map((cat) => (
                      <span key={cat} className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {cat}
                      </span>
                    ))}
                    {(req.formats || []).map((fmt) => (
                      <span key={fmt} className="badge badge-info" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Client Feedback Note if Changes Requested */}
                {isChangesRequested && req.clientFeedback && (
                  <div style={{
                    backgroundColor: 'var(--danger-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    borderLeft: '3px solid var(--danger)',
                    fontSize: '12px',
                    color: 'var(--danger-text)'
                  }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <AlertCircle size={14} />
                      <span>Client Revision Feedback:</span>
                    </div>
                    <div>{req.clientFeedback}</div>
                  </div>
                )}

                {/* Google Drive Proof Box (If submitted) */}
                {hasDriveLink && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '11.5px',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <GoogleDriveLink url={req.googleDriveUrl} compact />
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {req.deliveredAssetDescription ? req.deliveredAssetDescription.substring(0, 40) + '...' : 'Proof attached'}
                    </span>
                  </div>
                )}

                {/* Footer Info: Assigned Employee & Deadline */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '11.5px',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} color="var(--text-muted)" />
                    {req.assignedEmployee ? (
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{req.assignedEmployee}</span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '10px' }}>Unassigned</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} color="var(--text-muted)" />
                    <span>Due: <strong>{req.submissionDeadline || 'TBD'}</strong></span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', paddingTop: '4px' }}>
                  <button
                    onClick={() => setSelectedRequestDetails(req)}
                    className="btn-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <Eye size={13} />
                    <span>Inspect Brief</span>
                  </button>

                  {/* ADMIN: Assign Employee Button */}
                  {activeRole === 'admin' && (
                    <button
                      onClick={() => {
                        setAssignModalRequest(req);
                        setAssignedEmployeeName(req.assignedEmployee || employees[0]?.name || 'Sahil Mahale');
                      }}
                      className="btn-primary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      <User size={13} />
                      <span>{req.assignedEmployee ? 'Reassign' : 'Assign Operative'}</span>
                    </button>
                  )}

                  {/* EMPLOYEE: Start Work or Submit Deliverable */}
                  {activeRole === 'employee' && (
                    <>
                      {req.status === 'Assigned' && (
                        <button
                          onClick={() => updateContentRequestStatus(req.id, 'In Progress', 'Staff started production')}
                          className="btn-primary"
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          <span>Start Working</span>
                        </button>
                      )}

                      {(req.status === 'In Progress' || req.status === 'Changes Requested') && (
                        <button
                          onClick={() => {
                            setSubmitDeliverableModalRequest(req);
                            setSubmitDriveUrl(req.googleDriveUrl || '');
                            setSubmitAssetDesc(req.deliveredAssetDescription || '');
                            setSubmitPlatform((req.platforms && req.platforms[0]) || 'instagram');
                            setSubmitFormat((req.formats && req.formats[0]) || 'Reel');
                          }}
                          className="btn-primary"
                          style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: isChangesRequested ? 'var(--warning)' : 'var(--accent-primary)' }}
                        >
                          <Send size={13} />
                          <span>{isChangesRequested ? 'Resubmit Revision' : 'Submit Deliverable'}</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* CLIENT: Review & Sign-Off (If Submitted for Approval) */}
                  {activeRole === 'client' && req.status === 'Submitted for Approval' && (
                    <button
                      onClick={() => {
                        setClientReviewModalRequest(req);
                        setReviewFeedback('');
                      }}
                      className="btn-primary"
                      style={{ fontSize: '12px', padding: '6px 14px', backgroundColor: 'var(--success)' }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Review & Sign-Off</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          1. CREATE NEW CONTENT REQUEST MODAL (8 Full Sections: A through H)
          ===================================================================== */}
      <Modal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        title="Submit Creative Content Request"
        subtitle="Provide complete requirements, creative direction & distribution guidelines"
      >
        <form onSubmit={handleCreateRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
          {/* Section A: Basic Information */}
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              A. Basic Information
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Request Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Black Friday Master Video Teaser"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="saas-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-label">Client / Brand</label>
                  <select
                    value={reqClient}
                    onChange={(e) => setReqClient(e.target.value)}
                    className="saas-input"
                  >
                    {clients.map(c => (
                      <option key={c.id || c.account_id} value={c.name || c.business_name}>
                        {c.name || c.business_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-label">Industry Classification</label>
                  <select
                    value={reqIndustry}
                    onChange={(e) => setReqIndustry(e.target.value)}
                    className="saas-input"
                  >
                    {INDUSTRY_OPTIONS.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Product or Service Focused</label>
                <input
                  type="text"
                  placeholder="e.g. Carbon Horizon ANC Wireless Headphones"
                  value={reqProductOrService}
                  onChange={(e) => setReqProductOrService(e.target.value)}
                  className="saas-input"
                />
              </div>
            </div>
          </div>

          {/* Section B: Content Requirements */}
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              B. Content Requirements & Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-label">Content Topic <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acoustic Fidelity & Noise Cancellation"
                    value={reqTopic}
                    onChange={(e) => setReqTopic(e.target.value)}
                    className="saas-input"
                  />
                </div>

                <div className="saas-form-group" style={{ marginBottom: 0 }}>
                  <label className="saas-label">Content Objective</label>
                  <input
                    type="text"
                    placeholder="e.g. Drive pre-orders & direct consumer sales"
                    value={reqObjective}
                    onChange={(e) => setReqObjective(e.target.value)}
                    className="saas-input"
                  />
                </div>
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Main Core Message</label>
                <input
                  type="text"
                  placeholder="e.g. Silence the noise, unleash studio-grade master audio."
                  value={reqMainMessage}
                  onChange={(e) => setReqMainMessage(e.target.value)}
                  className="saas-input"
                />
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Detailed Creative Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Provide shot lists, talking points, script hooks, or exact scene sequences..."
                  value={reqDetailedInstructions}
                  onChange={(e) => setReqDetailedInstructions(e.target.value)}
                  className="saas-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* 10 Content Categories multi-select */}
              <div>
                <label className="saas-label" style={{ marginBottom: '6px', display: 'block' }}>
                  Select Content Categories (Multi-Select)
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CONTENT_CATEGORIES.map(cat => {
                    const isSelected = reqCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11.5px',
                          fontWeight: isSelected ? 600 : 500,
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Platform Selection & Preferred Formats */}
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              C. Platform Selection & Formats
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="saas-label" style={{ marginBottom: '6px', display: 'block' }}>
                  Target Platforms (Select 1 or more from the 7 supported)
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {SOCIAL_PLATFORMS.map(p => {
                    const isSelected = reqPlatforms.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 600 : 500,
                          backgroundColor: isSelected ? p.color + '20' : 'var(--bg-surface)',
                          color: isSelected ? p.color : 'var(--text-secondary)',
                          border: isSelected ? `2px solid ${p.color}` : '1px solid var(--border-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color }} />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="saas-label" style={{ marginBottom: '6px', display: 'block' }}>
                  Preferred Formats for Selected Platforms
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {availableFormatsForSelectedPlatforms.map(fmt => {
                    const isSelected = reqFormats.includes(fmt);
                    return (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => toggleFormat(fmt)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '11px',
                          fontWeight: isSelected ? 600 : 500,
                          backgroundColor: isSelected ? 'var(--accent-blue)' : 'var(--bg-surface)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid var(--accent-blue)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        {fmt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Target Audience */}
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              D. Target Audience Demographics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Audience Persona</label>
                <input
                  type="text"
                  value={reqAudienceType}
                  onChange={(e) => setReqAudienceType(e.target.value)}
                  className="saas-input"
                  placeholder="e.g. Creative Pros & Audiophiles"
                />
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Target Age Group</label>
                <input
                  type="text"
                  value={reqTargetAge}
                  onChange={(e) => setReqTargetAge(e.target.value)}
                  className="saas-input"
                  placeholder="e.g. 20-40"
                />
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Target Geographic Location</label>
                <input
                  type="text"
                  value={reqTargetLocation}
                  onChange={(e) => setReqTargetLocation(e.target.value)}
                  className="saas-input"
                  placeholder="e.g. North America, India Metros"
                />
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Preferred Language</label>
                <input
                  type="text"
                  value={reqLanguage}
                  onChange={(e) => setReqLanguage(e.target.value)}
                  className="saas-input"
                  placeholder="e.g. English"
                />
              </div>
            </div>
          </div>

          {/* Section E: Creative Direction */}
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              E. Creative Direction & Brand Aesthetics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Preferred Design Style</label>
                <input
                  type="text"
                  value={reqDesignStyle}
                  onChange={(e) => setReqDesignStyle(e.target.value)}
                  className="saas-input"
                  placeholder="e.g. Studio Minimalist, High Contrast"
                />
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Tone of Voice</label>
                <input
                  type="text"
                  value={reqToneOfVoice}
                  onChange={(e) => setReqToneOfVoice(e.target.value)}
                  className="saas-input"
                  placeholder="e.g. Confident, Technical, Inspiring"
                />
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Brand Palette Colors</label>
                <input
                  type="text"
                  value={reqBrandColors}
                  onChange={(e) => setReqBrandColors(e.target.value)}
                  className="saas-input"
                  placeholder="#0F172A, #4F46E5"
                />
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Reference Material URL</label>
                <input
                  type="url"
                  value={reqReferenceUrl}
                  onChange={(e) => setReqReferenceUrl(e.target.value)}
                  className="saas-input"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                <label className="saas-label">Additional Creative Instructions</label>
                <input
                  type="text"
                  value={reqAdditionalInstructions}
                  onChange={(e) => setReqAdditionalInstructions(e.target.value)}
                  className="saas-input"
                  placeholder="e.g. Include 15s cutdown for Instagram Story"
                />
              </div>
            </div>
          </div>

          {/* Section F, G, H: CTA, Deadline, Notes */}
          <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              F, G & H. Call to Action & Deadlines
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Call to Action (CTA)</label>
                <select
                  value={reqCTA}
                  onChange={(e) => setReqCTA(e.target.value)}
                  className="saas-input"
                >
                  {CTA_OPTIONS.map(cta => (
                    <option key={cta} value={cta}>{cta}</option>
                  ))}
                </select>
              </div>

              <div className="saas-form-group" style={{ marginBottom: 0 }}>
                <label className="saas-label">Preferred Submission Deadline <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="date"
                  required
                  value={reqDeadline}
                  onChange={(e) => setReqDeadline(e.target.value)}
                  className="saas-input"
                />
              </div>
            </div>

            <div className="saas-form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
              <label className="saas-label">Additional Deadline Instructions</label>
              <input
                type="text"
                placeholder="e.g. Pre-brief for Black Friday promo launch"
                value={reqDeadlineNotes}
                onChange={(e) => setReqDeadlineNotes(e.target.value)}
                className="saas-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsNewRequestModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              <Send size={15} />
              <span>Submit Content Request</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* =====================================================================
          2. ASSIGN EMPLOYEE MODAL (ADMIN)
          ===================================================================== */}
      {assignModalRequest && (
        <Modal
          isOpen={Boolean(assignModalRequest)}
          onClose={() => setAssignModalRequest(null)}
          title="Assign Content Brief to Staff"
          subtitle={`Request #${assignModalRequest.id}: ${assignModalRequest.title}`}
        >
          <form onSubmit={handleConfirmAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <strong>Client:</strong> {assignModalRequest.client} • <strong>Deadline:</strong> {assignModalRequest.submissionDeadline}
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Assign Creative Operative</label>
              <select
                value={assignedEmployeeName}
                onChange={(e) => setAssignedEmployeeName(e.target.value)}
                className="saas-input"
              >
                {employees.map(emp => (
                  <option key={emp.id || emp.account_id} value={emp.name || emp.full_name}>
                    {emp.name || emp.full_name} ({emp.role || emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setAssignModalRequest(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                <Check size={14} />
                <span>Confirm Assignment</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =====================================================================
          3. SUBMIT DELIVERABLE PROOF MODAL (EMPLOYEE)
          ===================================================================== */}
      {submitDeliverableModalRequest && (
        <Modal
          isOpen={Boolean(submitDeliverableModalRequest)}
          onClose={() => setSubmitDeliverableModalRequest(null)}
          title="Submit Content for Client Approval"
          subtitle={`Staging deliverable for Request #${submitDeliverableModalRequest.id}`}
        >
          <form onSubmit={handleConfirmDeliverableSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {submitUrlError && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--danger-subtle)', color: 'var(--danger-text)', fontSize: '12.5px' }}>
                {submitUrlError}
              </div>
            )}

            <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Upload your completed creative asset to Google Drive and paste the public viewable link below.
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Google Drive Shareable URL <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/.../view"
                  value={submitDriveUrl}
                  onChange={(e) => setSubmitDriveUrl(e.target.value)}
                  className="saas-input"
                  style={{ paddingLeft: '36px' }}
                />
                <LinkIcon size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="saas-form-group">
                <label className="saas-label">Platform</label>
                <select
                  value={submitPlatform}
                  onChange={(e) => setSubmitPlatform(e.target.value)}
                  className="saas-input"
                >
                  {(submitDeliverableModalRequest.platforms || ['instagram']).map(pId => {
                    const meta = getPlatformMeta(pId);
                    return <option key={pId} value={pId}>{meta.name}</option>;
                  })}
                </select>
              </div>

              <div className="saas-form-group">
                <label className="saas-label">Deliverable Format</label>
                <input
                  type="text"
                  value={submitFormat}
                  onChange={(e) => setSubmitFormat(e.target.value)}
                  className="saas-input"
                  placeholder="e.g. Reel 9:16"
                />
              </div>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Asset Notes / Caption</label>
              <textarea
                rows={3}
                placeholder="Briefly describe the delivered asset, aspect ratio, audio mix, or client copy..."
                value={submitAssetDesc}
                onChange={(e) => setSubmitAssetDesc(e.target.value)}
                className="saas-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setSubmitDeliverableModalRequest(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                <Send size={14} />
                <span>Submit for Client Sign-Off</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* =====================================================================
          4. CLIENT APPROVAL & REVISION MODAL (CLIENT)
          ===================================================================== */}
      {clientReviewModalRequest && (
        <Modal
          isOpen={Boolean(clientReviewModalRequest)}
          onClose={() => setClientReviewModalRequest(null)}
          title="Review Deliverable Proof"
          subtitle={`Request #${clientReviewModalRequest.id}: ${clientReviewModalRequest.title}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Operative</span>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {clientReviewModalRequest.assignedEmployee || 'Creative Team'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Delivered Asset Description</span>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {clientReviewModalRequest.deliveredAssetDescription || 'Creative asset prepared for review.'}
                </p>
              </div>

              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Google Drive Cloud Proof
                </span>
                <GoogleDriveLink url={clientReviewModalRequest.googleDriveUrl} />
              </div>
            </div>

            {/* Decision Mode Selection */}
            {reviewMode === 'revision' && (
              <div className="saas-form-group">
                <label className="saas-label">Required Revision Notes (Required for changes)</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the specific changes required (e.g. adjust audio level, trim beginning by 2s, replace logo)..."
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="saas-input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              {reviewMode === 'approve' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setReviewMode('revision')}
                    className="btn-secondary"
                    style={{ color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
                  >
                    <X size={14} />
                    <span>Request Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmClientReview('Approved')}
                    className="btn-primary"
                    style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                  >
                    <Check size={14} />
                    <span>Approve Deliverable</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setReviewMode('approve')}
                    className="btn-secondary"
                  >
                    Back to Approve
                  </button>

                  <button
                    type="button"
                    disabled={!reviewFeedback.trim()}
                    onClick={() => handleConfirmClientReview('Changes Requested')}
                    className="btn-primary"
                    style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }}
                  >
                    <MessageSquare size={14} />
                    <span>Send Revision Request</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* =====================================================================
          5. INSPECT FULL BRIEF MODAL
          ===================================================================== */}
      {selectedRequestDetails && (
        <Modal
          isOpen={Boolean(selectedRequestDetails)}
          onClose={() => setSelectedRequestDetails(null)}
          title={`Creative Brief: ${selectedRequestDetails.title}`}
          subtitle={`Request #${selectedRequestDetails.id} • ${selectedRequestDetails.client}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '12.5px' }}>
              <div><strong>Status:</strong> <span className={`badge ${getStatusBadge(selectedRequestDetails.status)}`}>{selectedRequestDetails.status}</span></div>
              <div><strong>Industry:</strong> {selectedRequestDetails.industry}</div>
              <div><strong>Assigned To:</strong> {selectedRequestDetails.assignedEmployee || 'Unassigned'}</div>
              <div><strong>Deadline:</strong> {selectedRequestDetails.submissionDeadline}</div>
              <div><strong>Call to Action:</strong> {selectedRequestDetails.callToAction}</div>
              <div><strong>Language:</strong> {selectedRequestDetails.preferredLanguage}</div>
            </div>

            <div>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Main Message & Hook:</h5>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                {selectedRequestDetails.mainMessage || 'No main message specified.'}
              </p>
            </div>

            <div>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Detailed Instructions:</h5>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '10px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                {selectedRequestDetails.detailedInstructions || 'Standard creative treatment.'}
              </p>
            </div>

            {selectedRequestDetails.googleDriveUrl && (
              <div>
                <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Google Drive Proof Link:</h5>
                <GoogleDriveLink url={selectedRequestDetails.googleDriveUrl} />
              </div>
            )}

            {/* Audit History Timeline */}
            <div>
              <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Workflow History:</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedRequestDetails.approvalHistory || []).map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-primary)', marginTop: '4px' }} />
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.action}</span>
                      <span style={{ color: 'var(--text-muted)' }}> by {h.by} • {h.timestamp}</span>
                      {h.notes && <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{h.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setSelectedRequestDetails(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

