import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  LayoutGrid,
  List,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  User,
  Pencil,
  Check
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function Clients() {
  const { clients, addClient, updateClient, employees } = useAppData();
  const { activeRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [viewMode, setViewMode] = useState('Table');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // client being edited

  // ── Add Form ──────────────────────────────────────────────
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [tier, setTier] = useState('Growth');
  const [sector, setSector] = useState('Consumer Tech');
  const [accountLead, setAccountLead] = useState(employees[0]?.name || '');
  const [monthlyRetainer, setMonthlyRetainer] = useState(15000);

  // ── Edit Form ─────────────────────────────────────────────
  const [editName, setEditName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editBrandDescription, setEditBrandDescription] = useState('');
  const [editTier, setEditTier] = useState('Growth');
  const [editSector, setEditSector] = useState('Consumer Tech');
  const [editAccountLead, setEditAccountLead] = useState('');
  const [editMonthlyRetainer, setEditMonthlyRetainer] = useState(15000);

  const TIER_PRICES = { Starter: 5000, Growth: 15000, Scale: 25000, Enterprise: 40000 };

  const handleTierChange = (val) => {
    setTier(val);
    if (TIER_PRICES[val] !== undefined) setMonthlyRetainer(TIER_PRICES[val]);
  };

  const handleEditTierChange = (val) => {
    setEditTier(val);
    if (TIER_PRICES[val] !== undefined) setEditMonthlyRetainer(TIER_PRICES[val]);
  };

  const filteredClients = clients.filter((c) => {
    if (tierFilter !== 'All' && c.tier !== tierFilter) return false;
    if (sectorFilter !== 'All' && c.sector !== sectorFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.name || c.business_name || '').toLowerCase().includes(q);
      const matchCode = (c.code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addClient({ name: name.trim(), contactPerson, brandDescription, tier, sector, accountLead, monthlyRetainer: Number(monthlyRetainer) || 10000 });
    setName(''); setContactPerson(''); setBrandDescription(''); setIsAddModalOpen(false);
  };

  const openEdit = (client) => {
    setEditTarget(client);
    setEditName(client.name || client.business_name || '');
    setEditContactPerson(client.contactPerson || client.contact_person || '');
    setEditBrandDescription(client.brandDescription || client.brand_description || '');
    setEditTier(client.tier || 'Growth');
    setEditSector(client.sector || 'Consumer Tech');
    setEditAccountLead(client.accountLead || '');
    setEditMonthlyRetainer(client.monthlyRetainer || 15000);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTarget) return;
    const clientId = editTarget.account_id || editTarget.id;
    updateClient(clientId, {
      name: editName,
      contactPerson: editContactPerson,
      brandDescription: editBrandDescription,
      tier: editTier,
      sector: editSector,
      accountLead: editAccountLead,
      monthlyRetainer: Number(editMonthlyRetainer) || 15000,
    });
    setEditTarget(null);
  };

  const totalMRR = clients.reduce((acc, c) => acc + (Number(c.monthlyRetainer) || 0), 0);

  const getTierBadge = (t = 'Growth') => {
    switch ((t || '').toLowerCase()) {
      case 'enterprise': return 'badge-primary';
      case 'scale': return 'badge-info';
      case 'growth': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  // Shared pencil button style
  const editBtnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0,
    transition: 'all var(--transition-fast)'
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title={activeRole === 'client' ? 'My Brand Account & Services' : 'Clients & Accounts Directory'}
        description={
          activeRole === 'client'
            ? "Your brand's agency service agreement, connected social handles, and lead account contact."
            : 'Portfolio management, contracted retainer values, and active client social channels.'
        }
        badge={`${clients.length} Accounts`}
        actions={
          activeRole === 'admin' && (
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
              <Plus size={15} />
              <span>Onboard Client</span>
            </button>
          )
        }
      />

      {/* KPI Cards */}
      {activeRole !== 'client' && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Active Retainers</span>
              <div className="kpi-icon-box"><Briefcase size={18} /></div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">{clients.length}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>brands</span>
            </div>
            <span className="kpi-subtitle">Managed under active service contracts</span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Contracted Monthly MRR</span>
              <div className="kpi-icon-box" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}>
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="kpi-value-row">
              <span className="kpi-value">₹{totalMRR.toLocaleString('en-IN')}</span>
            </div>
            <span className="kpi-subtitle">Total recurring agency billable base</span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Portfolio SLA Health</span>
              <div className="kpi-icon-box" style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
                <ShieldCheck size={18} />
              </div>
            </div>
            <div className="kpi-value-row"><span className="kpi-value">98.4%</span></div>
            <span className="kpi-subtitle">On-time campaign delivery compliance</span>
          </div>
        </div>
      )}

      {/* Filter & View Toolbar */}
      <div className="bento-card" style={{ padding: '14px 18px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'var(--bg-subtle)', padding: '7px 12px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', width: '240px'
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text" placeholder="Search brand or code..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '12.5px', width: '100%', color: 'var(--text-primary)' }}
              />
            </div>

            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
              className="saas-input" style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}>
              <option value="All">All Tiers</option>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Scale">Scale</option>
              <option value="Enterprise">Enterprise</option>
            </select>

            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}
              className="saas-input" style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}>
              <option value="All">All Sectors</option>
              <option value="Consumer Tech">Consumer Tech</option>
              <option value="Fashion & Apparel">Fashion & Apparel</option>
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="B2B SaaS">B2B SaaS</option>
            </select>
          </div>

          {/* View switcher */}
          <div style={{
            display: 'flex', backgroundColor: 'var(--bg-subtle)',
            padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)'
          }}>
            {['Table', 'Grid'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px',
                fontWeight: viewMode === mode ? 600 : 500,
                backgroundColor: viewMode === mode ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === mode ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === mode ? 'var(--shadow-xs)' : 'none',
                border: 'none', cursor: 'pointer'
              }}>
                {mode === 'Table' ? <List size={14} /> : <LayoutGrid size={14} />}
                <span>{mode === 'Grid' ? 'Cards' : mode}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABLE VIEW ─────────────────────────────────────────── */}
      {viewMode === 'Table' && (
        <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="saas-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="saas-table">
              <thead>
                <tr>
                  <th>CLIENT BRAND</th>
                  <th>TIER PACKAGE</th>
                  <th>SECTOR</th>
                  <th>ACCOUNT LEAD</th>
                  <th>MONTHLY RETAINER</th>
                  <th>CONNECTED HANDLES</th>
                  {activeRole === 'admin' && <th>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={activeRole === 'admin' ? 7 : 6} style={{ textAlign: 'center', padding: '36px' }}>
                      <EmptyState title="No clients found" description="No accounts match the current filter selection." />
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id || client.account_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '13px'
                          }}>
                            {(client.name || client.business_name || 'C').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{client.name || client.business_name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{client.contactPerson || client.contact_person || 'Principal'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge ${getTierBadge(client.tier)}`}>{client.tier || 'Growth'}</span></td>
                      <td><span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{client.sector || 'General'}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} color="var(--text-muted)" />
                          <span style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>{client.accountLead || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          ₹{(Number(client.monthlyRetainer) || 15000).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}> /mo</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {client.handles ? (
                            Object.entries(client.handles).map(([plat, handle]) => (
                              <span key={plat} className="badge badge-neutral" style={{ fontSize: '11px' }}>@{handle}</span>
                            ))
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>3 handles active</span>
                          )}
                        </div>
                      </td>
                      {activeRole === 'admin' && (
                        <td>
                          <button
                            onClick={() => openEdit(client)}
                            title="Edit client"
                            style={editBtnStyle}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-primary-subtle)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                          >
                            <Pencil size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GRID / CARDS VIEW ──────────────────────────────────── */}
      {viewMode === 'Grid' && (
        filteredClients.length === 0 ? (
          <EmptyState title="No clients found" description="No accounts match the current filter selection." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
            {filteredClients.map((client) => (
              <div key={client.id || client.account_id} className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '14px'
                    }}>
                      {(client.name || client.business_name || 'C').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{client.name || client.business_name}</h4>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{client.sector}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${getTierBadge(client.tier)}`}>{client.tier || 'Growth'}</span>
                    {activeRole === 'admin' && (
                      <button
                        onClick={() => openEdit(client)}
                        title="Edit client"
                        style={editBtnStyle}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--accent-primary-subtle)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, minHeight: '36px' }}>
                  {client.brandDescription || client.brand_description || 'Full-funnel digital presence and creative retainers.'}
                </p>

                <div style={{
                  padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Monthly Retainer</span>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{(Number(client.monthlyRetainer) || 15000).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Account Lead</span>
                    <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {client.accountLead || 'Unassigned'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── ONBOARD CLIENT MODAL ──────────────────────────────── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Client Brand"
        subtitle="Establish client service agreement and assign account lead"
      >
        <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Company / Brand Name</label>
            <input type="text" required placeholder="e.g. Apex Kinetic" value={name}
              onChange={(e) => setName(e.target.value)} className="saas-input" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Primary Contact Person</label>
              <input type="text" placeholder="e.g. Sai Chakankar" value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)} className="saas-input" />
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Industry Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="saas-input">
                <option value="Consumer Tech">Consumer Tech</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="B2B SaaS">B2B SaaS</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Retainer Package Tier</label>
              <select value={tier} onChange={(e) => handleTierChange(e.target.value)} className="saas-input">
                <option value="Starter">Starter (₹5,000/mo)</option>
                <option value="Growth">Growth (₹15,000/mo)</option>
                <option value="Scale">Scale (₹25,000/mo)</option>
                <option value="Enterprise">Enterprise (₹40,000/mo)</option>
              </select>
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Monthly Retainer (₹)</label>
              <input type="number" value={monthlyRetainer}
                onChange={(e) => setMonthlyRetainer(e.target.value)} className="saas-input" />
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Account Lead</label>
            <select value={accountLead} onChange={(e) => setAccountLead(e.target.value)} className="saas-input">
              {employees.map(e => (
                <option key={e.id || e.account_id} value={e.name || e.full_name}>
                  {e.name || e.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Brand Vision & Description</label>
            <textarea rows={2} placeholder="Key brand guidelines and audience notes..." value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)} className="saas-input" style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Onboard Client</button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT CLIENT MODAL ─────────────────────────────────── */}
      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit Client"
        subtitle={editTarget ? `Updating record for ${editName}` : ''}
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Company / Brand Name</label>
            <input type="text" required value={editName}
              onChange={(e) => setEditName(e.target.value)} className="saas-input" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Primary Contact Person</label>
              <input type="text" value={editContactPerson}
                onChange={(e) => setEditContactPerson(e.target.value)} className="saas-input" />
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Industry Sector</label>
              <select value={editSector} onChange={(e) => setEditSector(e.target.value)} className="saas-input">
                <option value="Consumer Tech">Consumer Tech</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Health & Wellness">Health & Wellness</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="B2B SaaS">B2B SaaS</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Retainer Package Tier</label>
              <select value={editTier} onChange={(e) => handleEditTierChange(e.target.value)} className="saas-input">
                <option value="Starter">Starter (₹5,000/mo)</option>
                <option value="Growth">Growth (₹15,000/mo)</option>
                <option value="Scale">Scale (₹25,000/mo)</option>
                <option value="Enterprise">Enterprise (₹40,000/mo)</option>
              </select>
            </div>
            <div className="saas-form-group">
              <label className="saas-label">Monthly Retainer (₹)</label>
              <input type="number" value={editMonthlyRetainer}
                onChange={(e) => setEditMonthlyRetainer(e.target.value)} className="saas-input" />
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Account Lead</label>
            <select value={editAccountLead} onChange={(e) => setEditAccountLead(e.target.value)} className="saas-input">
              <option value="">— Unassigned —</option>
              {employees.map(e => (
                <option key={e.id || e.account_id} value={e.name || e.full_name}>
                  {e.name || e.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Brand Vision & Description</label>
            <textarea rows={2} value={editBrandDescription}
              onChange={(e) => setEditBrandDescription(e.target.value)} className="saas-input" style={{ resize: 'vertical' }} />
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
