import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  LayoutGrid,
  List,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  User,
  ArrowRight
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { SOCIAL_PLATFORMS } from '../constants/platforms';

export default function Clients() {
  const { clients, addClient, employees } = useAppData();
  const { activeRole } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [sectorFilter, setSectorFilter] = useState('All');
  const [viewMode, setViewMode] = useState('Table'); // 'Table' or 'Grid'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [tier, setTier] = useState('Growth');
  const [sector, setSector] = useState('Consumer Tech');
  const [accountLead, setAccountLead] = useState(employees[0]?.name || 'Sahil Mahale');
  const [monthlyRetainer, setMonthlyRetainer] = useState(15000);

  const TIER_PRICES = {
    'Starter': 5000,
    'Growth': 15000,
    'Scale': 25000,
    'Enterprise': 40000
  };

  const handleTierChange = (newTier) => {
    setTier(newTier);
    if (TIER_PRICES[newTier] !== undefined) {
      setMonthlyRetainer(TIER_PRICES[newTier]);
    }
  };

  const filteredClients = clients.filter((c) => {
    if (tierFilter !== 'All' && c.tier !== tierFilter) return false;
    if (sectorFilter !== 'All' && c.sector !== sectorFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchCode = (c.code || '').toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    addClient({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      brandDescription: brandDescription.trim(),
      tier,
      sector,
      accountLead,
      monthlyRetainer: Number(monthlyRetainer) || 10000,
    });

    setName('');
    setContactPerson('');
    setBrandDescription('');
    setIsAddModalOpen(false);
  };

  const totalMRR = clients.reduce((acc, c) => acc + (Number(c.monthlyRetainer) || 0), 0);

  const getTierBadge = (t = 'Growth') => {
    switch (t.toLowerCase()) {
      case 'enterprise':
        return 'badge-primary';
      case 'scale':
        return 'badge-info';
      case 'growth':
        return 'badge-success';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title={activeRole === 'client' ? "My Brand Account & Services" : "Clients & Accounts Directory"}
        description={
          activeRole === 'client'
            ? "Your brand's agency service agreement, connected social handles, and lead account contact."
            : "Portfolio management, contracted retainer values, and active client social channels."
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
              <div className="kpi-icon-box">
                <Briefcase size={18} />
              </div>
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
            <div className="kpi-value-row">
              <span className="kpi-value">98.4%</span>
            </div>
            <span className="kpi-subtitle">On-time campaign delivery compliance</span>
          </div>
        </div>
      )}

      {/* Filter and View Toolbar */}
      <div className="bento-card" style={{ padding: '14px 18px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search box */}
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
                placeholder="Search brand or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '12.5px', width: '100%', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Tier filter */}
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="saas-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
              <option value="All">All Tiers</option>
              <option value="Starter">Starter</option>
              <option value="Growth">Growth</option>
              <option value="Scale">Scale</option>
              <option value="Enterprise">Enterprise</option>
            </select>

            {/* Sector filter */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="saas-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
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
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setViewMode('Table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: viewMode === 'Table' ? 600 : 500,
                backgroundColor: viewMode === 'Table' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'Table' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'Table' ? 'var(--shadow-xs)' : 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <List size={14} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('Grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: viewMode === 'Grid' ? 600 : 500,
                backgroundColor: viewMode === 'Grid' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'Grid' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                boxShadow: viewMode === 'Grid' ? 'var(--shadow-xs)' : 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          TABLE VIEW MODE
          ===================================================================== */}
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
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px' }}>
                      <EmptyState title="No clients found" description="No accounts match the current filter selection." />
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id || client.account_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--accent-primary-subtle)',
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px'
                          }}>
                            {(client.name || 'C').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{client.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{client.contactPerson || 'Principal'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getTierBadge(client.tier)}`}>
                          {client.tier || 'Growth'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{client.sector || 'General'}</span>
                      </td>
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
                              <span key={plat} className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                @{handle}
                              </span>
                            ))
                          ) : (
                            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                              3 handles active
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          GRID / CARDS VIEW MODE
          ===================================================================== */}
      {viewMode === 'Grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredClients.map((client) => (
            <div key={client.id || client.account_id} className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent-primary-subtle)',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '14px'
                  }}>
                    {(client.name || 'C').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{client.name}</h4>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{client.sector}</span>
                  </div>
                </div>

                <span className={`badge ${getTierBadge(client.tier)}`}>
                  {client.tier || 'Growth'}
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, minHeight: '36px' }}>
                {client.brandDescription || 'Full-funnel digital presence and creative retainers.'}
              </p>

              <div style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
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
                    {client.accountLead || 'Sahil Mahale'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboard Client Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Client Brand"
        subtitle="Establish client service agreement and assign account lead"
      >
        <form onSubmit={handleCreateClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Company / Brand Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Apex Kinetic"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="saas-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Primary Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Sai Chakankar"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="saas-input"
              />
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Industry Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="saas-input"
              >
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
              <select
                value={tier}
                onChange={(e) => handleTierChange(e.target.value)}
                className="saas-input"
              >
                <option value="Starter">Starter (₹5,000/mo)</option>
                <option value="Growth">Growth (₹15,000/mo)</option>
                <option value="Scale">Scale (₹25,000/mo)</option>
                <option value="Enterprise">Enterprise (₹40,000/mo)</option>
              </select>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Monthly Retainer (₹)</label>
              <input
                type="number"
                value={monthlyRetainer}
                onChange={(e) => setMonthlyRetainer(e.target.value)}
                className="saas-input"
              />
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Account Lead</label>
            <select
              value={accountLead}
              onChange={(e) => setAccountLead(e.target.value)}
              className="saas-input"
            >
              {employees.map(e => (
                <option key={e.id || e.account_id} value={e.name || e.full_name}>
                  {e.name || e.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Brand Vision & Description</label>
            <textarea
              rows={2}
              placeholder="Key brand guidelines and audience notes..."
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              className="saas-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Onboard Client
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
