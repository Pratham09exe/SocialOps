import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Rocket,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  FileText,
  Calendar,
  AlertCircle,
  UploadCloud,
  CheckSquare,
  ShieldCheck,
  TrendingUp,
  Users,
  Layers,
  Sparkles,
  DollarSign,
  Briefcase,
  Eye
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import GoogleDriveLink from '../components/common/GoogleDriveLink';
import EmptyState from '../components/common/EmptyState';
import { SOCIAL_PLATFORMS } from '../constants/platforms';

export default function Dashboard() {
  const { clients, tasks, approvals, invoices, employees, updateTaskStage, contentRequests = [] } = useAppData();
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  const [channelFilter, setChannelFilter] = useState('All');

  // Filter tasks based on channel
  const filteredTasks = tasks.filter((t) => {
    if (channelFilter === 'All') return true;
    const channelLower = (t.channel || '').toLowerCase();
    return channelLower.includes(channelFilter.toLowerCase());
  });

  const totalOutstanding = invoices
    .filter(i => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((acc, curr) => acc + (Number(curr.balanceDue !== undefined ? curr.balanceDue : curr.amount) || 0), 0);

  const pendingApprovals = approvals.filter(a => a.status !== 'Approved');
  const approvedDeliverables = approvals.filter(a => a.status === 'Approved');

  // Helper for platform pill
  const getPlatformMeta = (channelName = '') => {
    return SOCIAL_PLATFORMS.find(p => p.name.toLowerCase() === channelName.toLowerCase() || p.shortName.toLowerCase() === channelName.toLowerCase());
  };

  // =========================================================================
  // 1. ADMIN MENTAL MODEL VIEW (Bento Grid Layout)
  // =========================================================================
  if (activeRole === 'admin') {
    return (
      <div className="page-wrapper">
        <PageHeader
          title="Agency Operations Overview"
          description="Real-time visibility into client accounts, cross-channel deliverables, and cash collections."
          badge="Admin Command"
          actions={
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigate('/requests')} className="btn-secondary">
                <FileText size={15} />
                <span>Requests ({contentRequests.length})</span>
              </button>
              <button onClick={() => navigate('/tasks')} className="btn-secondary">
                <Layers size={15} />
                <span>Sprint Board</span>
              </button>
              <button onClick={() => navigate('/submit-content')} className="btn-primary">
                <UploadCloud size={15} />
                <span>Submit Deliverable</span>
              </button>
            </div>
          }
        />

        {/* Bento Hero KPI Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Active Retainers</span>
              <div className="kpi-icon-box">
                <Briefcase size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{clients.length}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>accounts</span>
            </div>
            <span className="kpi-subtitle">
              <span className="kpi-trend-positive"><TrendingUp size={13} /> Active</span> Managed across creative units
            </span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">In-Flight Deliverables</span>
              <div className="kpi-icon-box" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}>
                <Rocket size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{tasks.filter(t => t.stage !== 'Completed').length}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>running</span>
            </div>
            <span className="kpi-subtitle">
              {tasks.filter(t => t.stage === 'In Review').length} staged for review
            </span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Pending Approvals</span>
              <div className="kpi-icon-box" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{pendingApprovals.length}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>items</span>
            </div>
            <span className="kpi-subtitle">
              <span style={{ color: pendingApprovals.length > 0 ? 'var(--warning-text)' : 'var(--success)' }}>
                {pendingApprovals.length > 0 ? 'Action required' : 'All approved'}
              </span> • Cloud asset review
            </span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Outstanding Receivables</span>
              <div className="kpi-icon-box" style={{ background: 'var(--accent-purple-subtle)', color: 'var(--accent-purple)' }}>
                <FileText size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{totalOutstanding.toLocaleString('en-IN')}</span>
            </div>
            <span className="kpi-subtitle">
              Uncollected invoice balance in ledger
            </span>
          </div>
        </div>

        {/* Bento Grid: Deliverables Table (8 cols) + Right Intelligence Panels (4 cols) */}
        <div className="bento-grid">
          {/* Main Deliverables Panel */}
          <div className="bento-col-8">
            <div className="bento-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Active Deliverables & Campaigns</span>
                    <span className="badge badge-neutral" style={{ fontSize: '11px' }}>{filteredTasks.length} in sprint</span>
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Real-time status across creative workflows
                  </p>
                </div>

                {/* Channel filter pills */}
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {['All', ...SOCIAL_PLATFORMS.map(p => p.shortName)].map((ch) => {
                    const isSelected = channelFilter === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => setChannelFilter(ch)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '11.5px',
                          fontWeight: isSelected ? 600 : 500,
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                          border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <EmptyState title="No deliverables matching filter" description="Try selecting a different channel or create a new deliverable task." />
              ) : (
                <div className="saas-table-container" style={{ flex: 1 }}>
                  <table className="saas-table">
                    <thead>
                      <tr>
                        <th>CLIENT</th>
                        <th>DELIVERABLE</th>
                        <th>PLATFORM</th>
                        <th>STAGE</th>
                        <th>ASSIGNEE</th>
                        <th>DUE DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.slice(0, 6).map((task) => {
                        const pMeta = getPlatformMeta(task.channel);
                        return (
                          <tr key={task.id || task.task_id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {task.client || task.client_name}
                            </td>
                            <td>
                              <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.id || `TSK-${task.task_id}`}</div>
                            </td>
                            <td>
                              <span className="platform-pill" style={{ borderColor: pMeta ? pMeta.color + '40' : 'var(--border-subtle)' }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: pMeta ? pMeta.color : '#6366F1' }} />
                                {task.channel || 'Instagram'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                task.stage === 'Completed' ? 'badge-success' :
                                task.stage === 'In Review' ? 'badge-warning' :
                                task.stage === 'In Progress' ? 'badge-primary' : 'badge-neutral'
                              }`}>
                                {task.stage || task.status || 'To Do'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--accent-primary-subtle)',
                                  color: 'var(--accent-primary)',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {(task.assignee || task.assignee_name || 'U').charAt(0)}
                                </span>
                                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                                  {(task.assignee || task.assignee_name || 'Unassigned').split(' ')[0]}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.dueDate || task.due_date}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <Link to="/tasks" style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>Open Full Kanban Board</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Review Queue & Quick Command Hub */}
          <div className="bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Pending Approvals Widget */}
            <div className="bento-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="var(--warning)" />
                  <span>Review Queue</span>
                </h4>
                <Link to="/approvals" style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  View All ({pendingApprovals.length})
                </Link>
              </div>

              {pendingApprovals.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <CheckCircle2 size={24} color="var(--success)" style={{ margin: '0 auto 6px' }} />
                  <div>All creative deliverables approved!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pendingApprovals.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.client} • {item.format}
                        </div>
                      </div>
                      <Link to="/approvals" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 9px', flexShrink: 0 }}>
                        Inspect
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Navigation Panel */}
            <div className="bento-card">
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                Operational Navigation
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate('/requests')}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', padding: '10px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Content Requests & Briefs</span>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '10.5px' }}>{contentRequests.length}</span>
                </button>

                <button
                  onClick={() => navigate('/calendar')}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', padding: '10px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Publishing Calendar</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>

                <button
                  onClick={() => navigate('/invoices')}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', padding: '10px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={16} color="var(--accent-blue)" />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Financial Ledger & Invoices</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>

                <button
                  onClick={() => navigate('/workload')}
                  className="btn-secondary"
                  style={{ justifyContent: 'space-between', width: '100%', padding: '10px 14px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={16} color="var(--accent-purple)" />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Operative Capacity Intelligence</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. EMPLOYEE MENTAL MODEL VIEW (Staff Workspace)
  // =========================================================================
  if (activeRole === 'employee') {
    return (
      <div className="page-wrapper">
        <PageHeader
          title="My Sprint Priorities"
          description={`Welcome back, ${user?.name || 'Staff'}. Manage your creative tasks, stage review proofs, and hit sprint deadlines.`}
          badge="Operative Workspace"
          actions={
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => navigate('/requests')} className="btn-secondary">
                <FileText size={15} />
                <span>My Assigned Briefs</span>
              </button>
              <button onClick={() => navigate('/submit-content')} className="btn-primary">
                <UploadCloud size={15} />
                <span>Submit Deliverable Proof</span>
              </button>
            </div>
          }
        />

        {/* Employee KPI Row */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Assigned Deliverables</span>
              <div className="kpi-icon-box">
                <Layers size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{tasks.filter(t => t.stage !== 'Completed').length}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>active</span>
            </div>
            <span className="kpi-subtitle">Assigned to your production queue</span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Content Briefs</span>
              <div className="kpi-icon-box" style={{ background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
                <FileText size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">
                {contentRequests.filter(r => (r.assignedEmployee === user?.name || !r.assignedEmployee) && r.status !== 'Completed').length}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>briefs</span>
            </div>
            <span className="kpi-subtitle">Active briefs in production</span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Awaiting Signoff</span>
              <div className="kpi-icon-box" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
                <Clock size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{pendingApprovals.length}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>staged items</span>
            </div>
            <span className="kpi-subtitle">Internal QA and client review</span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Completed This Sprint</span>
              <div className="kpi-icon-box" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{tasks.filter(t => t.stage === 'Completed').length}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>approved</span>
            </div>
            <span className="kpi-subtitle">Deliverables ready for publishing</span>
          </div>
        </div>

        {/* Employee Active Tasks Board View */}
        <div className="bento-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>My Assigned Deliverables</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Update stage status directly as your production progresses
              </p>
            </div>
            <Link to="/tasks" className="btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }}>
              <span>Open Sprint Kanban</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="saas-table-container">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>CLIENT BRAND</th>
                  <th>DELIVERABLE</th>
                  <th>PLATFORM</th>
                  <th>STAGE / STATUS</th>
                  <th>DUE DATE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px' }}>
                      <EmptyState title="No deliverables assigned" description="You currently have no tasks assigned in this sprint." />
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                    const pMeta = getPlatformMeta(task.channel);
                    return (
                      <tr key={task.id || task.task_id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {task.client || task.client_name}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.id || `TSK-${task.task_id}`}</div>
                        </td>
                        <td>
                          <span className="platform-pill" style={{ borderColor: pMeta ? pMeta.color + '40' : 'var(--border-subtle)' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: pMeta ? pMeta.color : '#6366F1' }} />
                            {task.channel || 'Instagram'}
                          </span>
                        </td>
                        <td>
                          <select
                            value={task.stage || task.status || 'To Do'}
                            onChange={(e) => updateTaskStage(task.id || task.task_id, e.target.value)}
                            className="saas-input"
                            style={{
                              fontSize: '12px',
                              padding: '4px 10px',
                              width: 'auto',
                              fontWeight: 500
                            }}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="In Review">In Review</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.dueDate || task.due_date}</span>
                        </td>
                        <td>
                          <Link to="/submit-content" style={{ color: 'var(--accent-primary)', fontSize: '12.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span>Submit Proof</span>
                            <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. CLIENT MENTAL MODEL VIEW (Executive Approval Portal)
  // =========================================================================
  return (
    <div className="page-wrapper">
      <PageHeader
        title="Brand Workspace & Content Portal"
        description="Review staged social media deliverables, inspect cloud proof links, and approve posts for scheduling."
        badge="Client Portal"
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => navigate('/requests')} className="btn-primary">
              <FileText size={15} />
              <span>+ Submit Content Request</span>
            </button>
            <button onClick={() => navigate('/approvals')} className="btn-secondary">
              <CheckSquare size={15} />
              <span>Review Queue ({pendingApprovals.length})</span>
            </button>
          </div>
        }
      />

      {/* Client KPI Row */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Awaiting Your Approval</span>
            <div className="kpi-icon-box" style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{pendingApprovals.length}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>deliverables</span>
          </div>
          <span className="kpi-subtitle">Requires your executive review and signoff</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Approved & Ready</span>
            <div className="kpi-icon-box" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{approvedDeliverables.length}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>posts</span>
          </div>
          <span className="kpi-subtitle">Scheduled for upcoming social release</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Content Requests</span>
            <div className="kpi-icon-box" style={{ background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{contentRequests.length}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>submitted</span>
          </div>
          <span className="kpi-subtitle">
            <Link to="/requests" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Track brief progress &rarr;</Link>
          </span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Account Invoices</span>
            <div className="kpi-icon-box" style={{ background: 'var(--accent-purple-subtle)', color: 'var(--accent-purple)' }}>
              <FileText size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹{totalOutstanding.toLocaleString('en-IN')}</span>
          </div>
          <span className="kpi-subtitle">Outstanding balance due in ledger</span>
        </div>
      </div>

      {/* Pending Deliverables Staging List */}
      <div className="bento-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Content Awaiting Review</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Click "Review Deliverable" to inspect proofs and submit sign-off.
            </p>
          </div>
          <Link to="/approvals" className="btn-secondary" style={{ fontSize: '12px' }}>
            Open Approval Queue
          </Link>
        </div>

        {pendingApprovals.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="All deliverables are up to date!"
            description="You have reviewed all submitted creative assets. New deliverables will appear here as soon as the creative team stages them."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  flexWrap: 'wrap',
                  gap: '14px',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--bg-subtle)', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                    <img src={item.thumbnail} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span>{item.client}</span>
                      <span>&bull;</span>
                      <span className="badge badge-neutral" style={{ fontSize: '10.5px' }}>{item.format}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <GoogleDriveLink url={item.driveUrl} compact />
                  <button
                    onClick={() => navigate('/approvals')}
                    className="btn-primary"
                    style={{ fontSize: '12.5px', padding: '7px 14px' }}
                  >
                    <span>Review Deliverable</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
