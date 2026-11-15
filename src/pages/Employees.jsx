import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import {
  Users,
  UserPlus,
  Search,
  TrendingUp,
  Briefcase,
  Mail,
  Pencil,
  X,
  Check
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function Employees() {
  const { employees, addEmployee, updateEmployee, tasks } = useAppData();

  const [activeDept, setActiveDept] = useState('All Staff');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // employee being edited

  // ── Add Form ──────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Video Editor');
  const [department, setDepartment] = useState('Video Editors');
  const [billableRate, setBillableRate] = useState(1500);

  // ── Edit Form ─────────────────────────────────────────────
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editBillableRate, setEditBillableRate] = useState(1500);
  const [editStatus, setEditStatus] = useState('Active');

  const departments = ['All Staff', 'Video Editors', 'Copywriters', 'Strategists', 'Account Execs'];

  const filteredEmployees = employees.filter((emp) => {
    if (activeDept !== 'All Staff' && emp.department !== activeDept) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (emp.name || emp.full_name || '').toLowerCase().includes(q);
      const matchRole = (emp.role || emp.job_title || '').toLowerCase().includes(q);
      if (!matchName && !matchRole) return false;
    }
    return true;
  });

  // ── Handlers ──────────────────────────────────────────────
  const handleCreateEmployee = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    addEmployee({ name, email, role, department, billableRate: Number(billableRate) || 1500 });
    setName(''); setEmail(''); setIsAddModalOpen(false);
  };

  const openEdit = (emp) => {
    setEditTarget(emp);
    setEditName(emp.name || emp.full_name || '');
    setEditEmail(emp.email || '');
    setEditRole(emp.role || emp.job_title || '');
    setEditDepartment(emp.department || '');
    setEditBillableRate(emp.billableRate || emp.billable_rate || 1500);
    setEditStatus(emp.status || 'Active');
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTarget) return;
    const empId = editTarget.account_id || editTarget.id;
    updateEmployee(empId, {
      name: editName,
      email: editEmail,
      role: editRole,
      department: editDepartment,
      billableRate: Number(editBillableRate) || 1500,
      status: editStatus,
    });
    setEditTarget(null);
  };

  const activeCount = employees.filter(e => (e.status || 'Active') === 'Active').length;

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Agency Creative Operatives & Roster"
        description="Monitor staff bandwidth, billable allocations, and assign cross-functional creative resources."
        badge={`${employees.length} Operatives`}
        actions={
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
            <UserPlus size={15} />
            <span>Add Operative</span>
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Team Members</span>
            <div className="kpi-icon-box"><Users size={18} /></div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{activeCount}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>operatives</span>
          </div>
          <span className="kpi-subtitle">Video editors, copywriters, strategists</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Team Utilization</span>
            <div className="kpi-icon-box" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="kpi-value-row"><span className="kpi-value">76%</span></div>
          <span className="kpi-subtitle">Within optimal delivery bandwidth (75–85%)</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Blended Hourly Rate</span>
            <div className="kpi-icon-box" style={{ background: 'var(--accent-purple-subtle)', color: 'var(--accent-purple)' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">₹1,850</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/hr</span>
          </div>
          <span className="kpi-subtitle">Standard client billing allocation rate</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bento-card" style={{ padding: '14px 18px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {departments.map((dept) => {
              const isSelected = activeDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-subtle)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {dept}
                </button>
              );
            })}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'var(--bg-subtle)', padding: '7px 12px',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', width: '230px'
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search operative or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', backgroundColor: 'transparent', fontSize: '12.5px', width: '100%', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Operative Cards Grid */}
      {filteredEmployees.length === 0 ? (
        <EmptyState title="No operatives found" description="No team members match this filter." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredEmployees.map((emp) => {
            const empName = emp.name || emp.full_name || 'Staff';
            const empRole = emp.role || emp.job_title || 'Specialist';
            const assignedCount = tasks.filter(t =>
              (t.assignee || t.assignee_name) === empName && t.stage !== 'Completed'
            ).length;
            const utilizationPct = Math.min(100, Math.max(30, (assignedCount * 25) || 60));

            return (
              <div key={emp.id || emp.account_id} className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '14px', flexShrink: 0
                    }}>
                      {empName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{empName}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{empRole}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-success">{emp.status || 'Active'}</span>
                    {/* ── EDIT BUTTON ── */}
                    <button
                      onClick={() => openEdit(emp)}
                      title="Edit employee"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-primary-subtle)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Mail size={13} color="var(--text-muted)" />
                  <span>{emp.email}</span>
                </div>

                {/* Capacity Progress Bar */}
                <div style={{
                  padding: '12px', borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <span>Production Bandwidth</span>
                    <span style={{ fontWeight: 600, color: utilizationPct > 85 ? 'var(--warning-text)' : 'var(--text-primary)' }}>
                      {utilizationPct}% Utilized
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', borderRadius: '999px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${utilizationPct}%`, height: '100%',
                      backgroundColor: utilizationPct > 85 ? 'var(--warning)' : 'var(--accent-primary)',
                      borderRadius: '999px'
                    }} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '12.5px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Billable Rate: </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{(emp.billableRate || emp.billable_rate || 1500).toLocaleString('en-IN')}/hr
                    </span>
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                    {assignedCount} active deliverables
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD MEMBER MODAL ─────────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Creative Operative"
        subtitle="Provision staff member credentials and billable allocation"
      >
        <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Full Name</label>
            <input type="text" required placeholder="e.g. Maya Chen" value={name}
              onChange={(e) => setName(e.target.value)} className="saas-input" />
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Work Email</label>
            <input type="email" required placeholder="maya.c@agency.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className="saas-input" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} className="saas-input">
                <option value="Video Editors">Video Editors</option>
                <option value="Copywriters">Copywriters</option>
                <option value="Strategists">Strategists</option>
                <option value="Account Execs">Account Execs</option>
              </select>
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Role Title</label>
              <input type="text" placeholder="Senior Motion Designer" value={role}
                onChange={(e) => setRole(e.target.value)} className="saas-input" />
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Billable Rate (₹/hr)</label>
            <input type="number" value={billableRate}
              onChange={(e) => setBillableRate(e.target.value)} className="saas-input" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Operative</button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT EMPLOYEE MODAL ───────────────────────────────── */}
      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit Team Member"
        subtitle={editTarget ? `Updating record for ${editName}` : ''}
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Full Name</label>
            <input type="text" required value={editName}
              onChange={(e) => setEditName(e.target.value)} className="saas-input" />
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Work Email</label>
            <input type="email" required value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)} className="saas-input" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Department</label>
              <select value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className="saas-input">
                <option value="Video Editors">Video Editors</option>
                <option value="Copywriters">Copywriters</option>
                <option value="Strategists">Strategists</option>
                <option value="Account Execs">Account Execs</option>
              </select>
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Role Title</label>
              <input type="text" value={editRole}
                onChange={(e) => setEditRole(e.target.value)} className="saas-input" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Billable Rate (₹/hr)</label>
              <input type="number" value={editBillableRate}
                onChange={(e) => setEditBillableRate(e.target.value)} className="saas-input" />
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="saas-input">
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">
              <Check size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
