import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import {
  LayoutDashboard,
  Activity,
  Building2,
  Users,
  BarChart3,
  Calendar,
  Kanban,
  CheckSquare,
  UploadCloud,
  Receipt,
  CreditCard,
  LogOut,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Building,
  Sparkles,
  X,
  FileText
} from 'lucide-react';

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) {
  const { user, activeRole, logout } = useAuth();
  const { approvals, contentRequests = [] } = useAppData();
  const navigate = useNavigate();

  // Pending count for Approval Queue badge
  const pendingApprovalsCount = approvals.filter(
    (a) =>
      a.status === 'Needs Internal Review' ||
      a.status === 'Urgent Changes Requested' ||
      a.status === 'Client Review Required'
  ).length;

  // Requests badges
  const adminPendingRequests = contentRequests.filter(
    (r) => r.status === 'Submitted' || r.status === 'Under Review'
  ).length;

  const employeeAssignedRequests = contentRequests.filter(
    (r) =>
      (r.assignedEmployee === user?.name || !r.assignedEmployee) &&
      (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Changes Requested')
  ).length;

  const clientApprovalRequests = contentRequests.filter(
    (r) => r.status === 'Submitted for Approval'
  ).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = (isActive) =>
    `sidebar-nav-item ${isActive ? 'active' : ''}`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 49,
            display: 'block'
          }}
        />
      )}

      <aside
        style={{
          width: isCollapsed ? '78px' : '260px',
          minWidth: isCollapsed ? '78px' : '260px',
          maxWidth: isCollapsed ? '78px' : '260px',
          height: '100vh',
          maxHeight: '100vh',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobileOpen ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'var(--shadow-xs)',
          overflow: 'hidden',
          flexShrink: 0
        }}
        className={`sidebar-container ${isMobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '0' : '0 20px',
            borderBottom: '1px solid var(--border-subtle)',
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none'
            }}
          >
            <img
              src="/logo.png"
              alt="SocialOps"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
              }}
            />
            {!isCollapsed && (
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '16px',
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  SocialOps
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      backgroundColor: 'var(--accent-primary-subtle)',
                      color: 'var(--accent-primary)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}
                  >
                    PRO
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Agency Suite
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle (Desktop) */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: isCollapsed ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Authenticated Workspace Role Badge (No manual role switching allowed) */}
        {!isCollapsed ? (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {activeRole === 'admin' ? (
                <ShieldCheck size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              ) : activeRole === 'employee' ? (
                <UserCheck size={18} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
              ) : (
                <Building size={18} color="var(--success)" style={{ flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Workspace Role
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {activeRole === 'admin' ? 'Platform Administrator' : activeRole === 'employee' ? 'Agency Staff' : 'Client Representative'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <button
              onClick={onToggleCollapse}
              title="Expand Sidebar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                backgroundColor: 'var(--accent-primary-subtle)'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav
          style={{
            flex: '1 1 0%',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: isCollapsed ? '12px 8px 16px' : '14px 12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {/* ================= ADMIN MENTAL MODEL ================= */}
          {activeRole === 'admin' && (
            <>
              {!isCollapsed && (
                <div style={sectionHeaderStyle}>Overview</div>
              )}
              <SidebarLink
                to="/"
                icon={LayoutDashboard}
                label="Dashboard"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/activity-log"
                icon={Activity}
                label="Activity Log"
                isCollapsed={isCollapsed}
              />

              {!isCollapsed && (
                <div style={{ ...sectionHeaderStyle, marginTop: '16px' }}>Operations</div>
              )}
              <SidebarLink
                to="/requests"
                icon={FileText}
                label="Content Requests"
                badge={adminPendingRequests > 0 ? adminPendingRequests : null}
                badgeColor="var(--accent-primary)"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/clients"
                icon={Building2}
                label="Clients Directory"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/profile"
                icon={Building}
                label="Brand Profile Editor"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/employees"
                icon={Users}
                label="Team & Roster"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/workload"
                icon={BarChart3}
                label="Workload Capacity"
                isCollapsed={isCollapsed}
              />

              {!isCollapsed && (
                <div style={{ ...sectionHeaderStyle, marginTop: '16px' }}>Delivery</div>
              )}
              <SidebarLink
                to="/tasks"
                icon={Kanban}
                label="Task Board"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/calendar"
                icon={Calendar}
                label="Content Calendar"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/approvals"
                icon={CheckSquare}
                label="Approval Queue"
                badge={pendingApprovalsCount > 0 ? pendingApprovalsCount : null}
                badgeColor="var(--warning)"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/submit-content"
                icon={UploadCloud}
                label="Submit Content"
                isCollapsed={isCollapsed}
              />

              {!isCollapsed && (
                <div style={{ ...sectionHeaderStyle, marginTop: '16px' }}>Financials</div>
              )}
              <SidebarLink
                to="/invoices"
                icon={Receipt}
                label="Invoices & Payments"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/expenses"
                icon={CreditCard}
                label="Agency Expenses"
                isCollapsed={isCollapsed}
              />
            </>
          )}

          {/* ================= EMPLOYEE MENTAL MODEL ================= */}
          {activeRole === 'employee' && (
            <>
              {!isCollapsed && (
                <div style={sectionHeaderStyle}>My Workspace</div>
              )}
              <SidebarLink
                to="/"
                icon={LayoutDashboard}
                label="My Priorities"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/requests"
                icon={FileText}
                label="Content Briefs"
                badge={employeeAssignedRequests > 0 ? employeeAssignedRequests : null}
                badgeColor="var(--accent-primary)"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/tasks"
                icon={Kanban}
                label="Assigned Tasks"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/calendar"
                icon={Calendar}
                label="Schedule"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/submit-content"
                icon={UploadCloud}
                label="Submit Deliverable"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/approvals"
                icon={CheckSquare}
                label="Review Status"
                badge={pendingApprovalsCount > 0 ? pendingApprovalsCount : null}
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/clients"
                icon={Building2}
                label="Client Accounts"
                isCollapsed={isCollapsed}
              />
            </>
          )}

          {/* ================= CLIENT MENTAL MODEL ================= */}
          {activeRole === 'client' && (
            <>
              {!isCollapsed && (
                <div style={sectionHeaderStyle}>Brand Portal</div>
              )}
              <SidebarLink
                to="/"
                icon={LayoutDashboard}
                label="Overview"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/requests"
                icon={FileText}
                label="Content Requests"
                badge={clientApprovalRequests > 0 ? clientApprovalRequests : null}
                badgeColor="var(--warning)"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/approvals"
                icon={CheckSquare}
                label="Review Queue"
                badge={pendingApprovalsCount > 0 ? pendingApprovalsCount : null}
                badgeColor="var(--warning)"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/profile"
                icon={Building2}
                label="Brand & Socials"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/tasks"
                icon={FolderKanban}
                label="Deliverable Progress"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/calendar"
                icon={Calendar}
                label="Campaign Schedule"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/invoices"
                icon={Receipt}
                label="Invoices & Receipts"
                isCollapsed={isCollapsed}
              />
              <SidebarLink
                to="/clients"
                icon={Building2}
                label="My Brand Profile"
                isCollapsed={isCollapsed}
              />
            </>
          )}
        </nav>

        {/* User Profile & Sign Out Footer - Permanently pinned to bottom */}
        <div
          style={{
            flexShrink: 0,
            marginTop: 'auto',
            padding: isCollapsed ? '12px 6px' : '14px 16px',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            position: 'relative',
            zIndex: 10,
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              gap: isCollapsed ? '8px' : '10px',
              flexDirection: isCollapsed ? 'column' : 'row'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <img
                src={
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                }
                alt={user?.name || 'User'}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid var(--accent-primary)',
                  flexShrink: 0
                }}
              />
              {!isCollapsed && (
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {user?.name || 'Administrator'}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {activeRole === 'admin'
                      ? 'Agency Executive'
                      : activeRole === 'employee'
                      ? 'Creative Staff'
                      : 'Brand Representative'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              data-testid="logout-btn"
              title="Sign Out"
              aria-label="Sign Out"
              style={{
                width: isCollapsed ? '28px' : '32px',
                height: isCollapsed ? '28px' : '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--danger-subtle)';
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.borderColor = 'var(--danger-border)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <LogOut size={isCollapsed ? 13 : 15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const sectionHeaderStyle = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '6px 10px 4px',
  marginBottom: '2px'
};

function SidebarLink({ to, icon: Icon, label, badge, badgeColor, isCollapsed }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      title={isCollapsed ? label : undefined}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        padding: isCollapsed ? '10px 0' : '9px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
        backgroundColor: isActive ? 'var(--accent-primary-subtle)' : 'transparent',
        transition: 'all 0.15s ease',
        textDecoration: 'none',
        position: 'relative'
      })}
    >
      {({ isActive }) => (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <Icon
              size={18}
              color={isActive ? 'var(--accent-primary)' : 'currentColor'}
              style={{ flexShrink: 0 }}
            />
            {!isCollapsed && <span>{label}</span>}
          </div>

          {!isCollapsed && badge !== undefined && badge !== null && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '999px',
                backgroundColor: badgeColor || 'var(--accent-primary)',
                color: '#FFFFFF',
                lineHeight: 1
              }}
            >
              {badge}
            </span>
          )}

          {isCollapsed && badge !== undefined && badge !== null && (
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '8px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: badgeColor || 'var(--accent-primary)'
              }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}
