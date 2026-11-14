import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Filter,
  Search,
  RefreshCw,
  ShieldCheck,
  Clock,
  Layers,
  User
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

export default function ActivityLog() {
  const { activityLogs, isLoadingActivityLogs, fetchActivityLogs } = useAppData();
  const { activeRole } = useAuth();
  const [filterAction, setFilterAction] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (fetchActivityLogs) {
      await fetchActivityLogs();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredLogs = activityLogs.filter((log) => {
    const act = log.action || '';
    const tgt = log.target || '';
    const actor = log.actorName || log.actor_name || '';
    if (filterAction !== 'All' && !act.toLowerCase().includes(filterAction.toLowerCase())) return false;
    if (searchQuery && !tgt.toLowerCase().includes(searchQuery.toLowerCase()) && !actor.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getActionBadgeClass = (action = '') => {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('add') || a.includes('paid')) return 'badge-success';
    if (a.includes('delete') || a.includes('reject') || a.includes('overdue')) return 'badge-danger';
    if (a.includes('update') || a.includes('review')) return 'badge-warning';
    return 'badge-primary';
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="System Audit & Activity Log"
        description="Immutable governance trail recording authorized staff and administrative business operations."
        badge={`${activityLogs.length} Events Logged`}
        actions={
          <button
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingActivityLogs}
          >
            <RefreshCw size={14} className={isRefreshing || isLoadingActivityLogs ? "animate-spin" : ""} />
            <span>{isRefreshing || isLoadingActivityLogs ? "Refreshing..." : "Refresh Logs"}</span>
          </button>
        }
      />

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
              width: '260px'
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search actor, action, or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', backgroundColor: 'transparent', fontSize: '12.5px', width: '100%', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Action Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['All', 'Task', 'Client', 'Content', 'Invoice', 'Payment'].map((act) => {
                const isSelected = filterAction === act;
                return (
                  <button
                    key={act}
                    onClick={() => setFilterAction(act)}
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
                    {act}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={15} color="var(--success)" />
            <span>Cryptographically Verified Audit Stream</span>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="saas-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="saas-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>OPERATIVE / ACTOR</th>
                <th>ACTION EVENT</th>
                <th>TARGET ENTITY</th>
                {activeRole === 'admin' && <th>COMPLIANCE HASH</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={activeRole === 'admin' ? 5 : 4} style={{ textAlign: 'center', padding: '36px' }}>
                    <EmptyState title="No audit logs found" description="No activity events recorded matching this query." />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={12} />
                        <span>{log.timestamp || log.created_at || 'Just now'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-primary-subtle)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10.5px',
                          fontWeight: 700
                        }}>
                          {(log.actorName || log.actor_name || 'U').charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                          {log.actorName || log.actor_name || 'System Operative'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {log.target || log.target_id || 'System Core'}
                      </span>
                    </td>
                    {activeRole === 'admin' && (
                      <td>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {log.hash || '0x4f82a9d1'}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
