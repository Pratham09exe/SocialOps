import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Zap,
  Users,
  Activity,
  Layers,
  TrendingUp
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';

export default function WorkloadReport() {
  const { workloadTeam, autoRebalanceWorkload } = useAppData();
  const [rebalancedNotice, setRebalancedNotice] = useState(false);

  const overallocatedCount = workloadTeam.filter(m => m.utilization > 100).length;
  const totalAllocated = workloadTeam.reduce((acc, m) => acc + (m.allocatedHours || 0), 0);
  const totalMax = workloadTeam.reduce((acc, m) => acc + (m.maxHours || 40), 0);
  const overallUtilization = totalMax > 0 ? Math.round((totalAllocated / totalMax) * 100) : 78;
  const availableCapacity = Math.max(0, Math.round(totalMax - totalAllocated));

  const handleRebalance = () => {
    autoRebalanceWorkload();
    setRebalancedNotice(true);
    setTimeout(() => setRebalancedNotice(false), 5000);
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Workload & Capacity Intelligence"
        description="Monitor operative bandwidth, delivery burn rates, and auto-rebalance sprint allocations."
        badge={`${overallUtilization}% Capacity`}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleRebalance} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} color="var(--accent-primary)" />
              <span>Auto-Rebalance Team</span>
            </button>
          </div>
        }
      />

      {rebalancedNotice && (
        <div style={{
          backgroundColor: 'var(--success-subtle)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="var(--success)" />
          <div style={{ fontSize: '13px', color: 'var(--success-text)', fontWeight: 500 }}>
            Team capacity successfully rebalanced across all active operatives.
          </div>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Team Utilization</span>
            <div className="kpi-icon-box">
              <Activity size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{overallUtilization}%</span>
          </div>
          <span className="kpi-subtitle">Target healthy threshold: 75% - 85%</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Overallocated Staff</span>
            <div className="kpi-icon-box" style={{
              background: overallocatedCount > 0 ? 'var(--danger-subtle)' : 'var(--success-subtle)',
              color: overallocatedCount > 0 ? 'var(--danger)' : 'var(--success)'
            }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{overallocatedCount}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>members</span>
          </div>
          <span className="kpi-subtitle">
            {overallocatedCount > 0 ? `${overallocatedCount} operative(s) exceeding 100% capacity` : 'All operatives in healthy range'}
          </span>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Available Bandwidth</span>
            <div className="kpi-icon-box" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}>
              <Zap size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{availableCapacity} hrs</span>
          </div>
          <span className="kpi-subtitle">Uncommitted production hours this week</span>
        </div>
      </div>

      {/* Operative Bandwidth Breakdown */}
      <div className="bento-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Individual Operative Utilization</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Real-time sprint hours committed vs. total maximum threshold
            </p>
          </div>
          <button onClick={handleRebalance} className="btn-primary" style={{ fontSize: '12.5px' }}>
            <Zap size={14} />
            <span>Optimize Bandwidth</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {workloadTeam.map((member) => {
            const isOver = member.utilization > 100;
            const isNear = member.utilization >= 85 && member.utilization <= 100;

            return (
              <div
                key={member.name}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: 'var(--accent-primary)'
                    }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>{member.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{member.role || 'Creative Staff'}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <strong>{member.allocatedHours} hrs</strong> / {member.maxHours || 40} hrs
                    </span>
                    <span className={`badge ${
                      isOver ? 'badge-danger' :
                      isNear ? 'badge-warning' : 'badge-success'
                    }`}>
                      {member.utilization}% {isOver ? 'Overallocated' : isNear ? 'Near Capacity' : 'Optimal'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', borderRadius: '999px', backgroundColor: 'var(--bg-surface)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <div style={{
                    width: `${Math.min(100, member.utilization)}%`,
                    height: '100%',
                    backgroundColor: isOver ? 'var(--danger)' : isNear ? 'var(--warning)' : 'var(--accent-primary)',
                    borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
