import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Modal from '../common/Modal';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SOCIAL_PLATFORMS } from '../../constants/platforms';
import {
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Check,
  User,
  Mail,
  Building,
  Key
} from 'lucide-react';

export default function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { clients, addTask, addCalendarEvent, isBackendConnected } = useAppData();
  const { user, activeRole } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [campaignName, setCampaignName] = useState('');
  const [selectedClient, setSelectedClient] = useState(clients[0]?.name || '');
  const [channel, setChannel] = useState('Instagram');
  const [targetDate, setTargetDate] = useState('2026-11-20');

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!campaignName) return;

    addTask({
      title: campaignName,
      client: selectedClient || (clients[0]?.name || 'Apex Media Global'),
      channel: channel,
      priority: 'High',
      assignee: 'Elena Rostova',
      dueDate: targetDate,
      sla: '48h left'
    });

    addCalendarEvent({
      day: parseInt(targetDate.split('-')[2]) || 20,
      title: campaignName,
      client: selectedClient || (clients[0]?.name || 'Apex Media Global'),
      platform: channel,
      status: 'Scheduled',
      time: '14:00'
    });

    setCampaignName('');
    setIsCampaignModalOpen(false);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Region */}
      <div className="main-content">
        <Header
          onOpenNewCampaign={() => setIsCampaignModalOpen(true)}
          onToggleMobile={() => setIsMobileSidebarOpen(prev => !prev)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
        <main style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>
      </div>

      {/* Initialize New Deliverable Modal */}
      <Modal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        title="Initialize Campaign Deliverable"
        subtitle="Provision cross-platform asset requirements, set SLA deadlines, and assign lead specialists."
      >
        <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Campaign Deliverable Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Black Friday Influencer Spark Teaser"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="saas-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Client Account</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="saas-select"
              >
                {clients.map(c => (
                  <option key={c.id || c.account_id} value={c.name || c.business_name}>
                    {c.name || c.business_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Primary Social Network</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="saas-select"
              >
                {SOCIAL_PLATFORMS.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Target Publishing / Sign-off Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="saas-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsCampaignModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Provision Deliverable
            </button>
          </div>
        </form>
      </Modal>

      {/* Profile & System Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title="Account & System Settings"
        subtitle="Manage your profile preferences, appearance mode, and agency workspace connection."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name}
              style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }}
            />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <Mail size={13} />
                <span>{user?.email || 'alex.m@socialops.agency'}</span>
              </div>
              <div style={{ marginTop: '6px' }}>
                <span className="badge badge-primary">
                  {activeRole.toUpperCase()} ROLE
                </span>
              </div>
            </div>
          </div>

          {/* Theme Preference */}
          <div>
            <label className="saas-label" style={{ marginBottom: '10px' }}>Interface Theme</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => isDark && toggleTheme()}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: `2px solid ${!isDark ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: !isDark ? 'var(--accent-primary-subtle)' : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <Sun size={18} color={!isDark ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Light Mode</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Crisp SaaS Light</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => !isDark && toggleTheme()}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: `2px solid ${isDark ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  backgroundColor: isDark ? 'var(--accent-primary-subtle)' : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer'
                }}
              >
                <Moon size={18} color={isDark ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Dark Mode</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Deep Slate Navy</div>
                </div>
              </button>
            </div>
          </div>

          {/* Connectivity Status */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                FastAPI Backend Connection
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {isBackendConnected ? 'Active live sync at http://127.0.0.1:8000' : 'Offline - running in reactive store'}
              </div>
            </div>
            <span className={`badge ${isBackendConnected ? 'badge-success' : 'badge-warning'}`}>
              {isBackendConnected ? 'ONLINE' : 'LOCAL'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              onClick={() => setIsSettingsModalOpen(false)}
              className="btn-primary"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
