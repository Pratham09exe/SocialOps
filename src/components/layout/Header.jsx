import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Search,
  Bell,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  X,
  Sun,
  Moon,
  Plus,
  Menu,
  Sliders,
  Sparkles,
  Zap
} from 'lucide-react';

export default function Header({
  onOpenNewCampaign,
  onToggleMobile,
  onOpenSettings
}) {
  const { user, activeRole } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    isBackendConnected,
    notifications,
    unreadNotificationsCount,
    isLoadingNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchNotifications
  } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen]);

  const handleToggleNotifs = () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    if (nextState && fetchNotifications) {
      fetchNotifications();
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'CONTENT_APPROVED':
        return <CheckCircle2 size={15} color="var(--success)" />;
      case 'REVISION_REQUESTED':
        return <AlertCircle size={15} color="var(--warning)" />;
      case 'TASK_ASSIGNED':
      case 'TASK_DEADLINE':
        return <Clock size={15} color="var(--accent-primary)" />;
      case 'INVOICE_CREATED':
      case 'PAYMENT_RECORDED':
        return <CreditCard size={15} color="var(--success)" />;
      default:
        return <Bell size={15} color="var(--text-secondary)" />;
    }
  };

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backdropFilter: 'blur(10px)',
        transition: 'background-color var(--transition-normal), border-color var(--transition-normal)'
      }}
    >
      {/* Left Region: Mobile Menu + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, maxWidth: '540px' }}>
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="mobile-menu-btn"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
          >
            <Menu size={18} />
          </button>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '7px 14px',
            width: '100%',
            maxWidth: '420px',
            transition: 'all var(--transition-fast)'
          }}
          className="search-container-box"
        >
          <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search deliverables, tasks, clients, team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '13.5px',
              color: 'var(--text-primary)',
              width: '100%',
              outline: 'none'
            }}
          />
          <kbd
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '2px 5px',
              lineHeight: 1
            }}
          >
            /
          </kbd>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Backend Connectivity Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '999px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-secondary)'
          }}
          title={
            isBackendConnected
              ? 'Connected to Python FastAPI Backend at http://127.0.0.1:8000'
              : 'Running on reactive client-side store'
          }
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isBackendConnected ? 'var(--success)' : 'var(--warning)',
              boxShadow: isBackendConnected
                ? '0 0 8px rgba(16, 185, 129, 0.6)'
                : '0 0 8px rgba(245, 158, 11, 0.6)'
            }}
          />
          <span style={{ fontSize: '11.5px', fontWeight: 600 }}>
            {isBackendConnected ? 'API Live' : 'Local Mode'}
          </span>
        </div>

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#FBBF24' : 'var(--text-secondary)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Notifications Dropdown Container */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={handleToggleNotifs}
            title="Notifications"
            aria-expanded={isNotifOpen}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: isNotifOpen ? 'var(--accent-primary-subtle)' : 'var(--bg-subtle)',
              border: `1px solid ${isNotifOpen ? 'var(--accent-primary-border)' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isNotifOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
          >
            <Bell size={17} />
            {unreadNotificationsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 700,
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 5px rgba(79, 70, 229, 0.4)'
                }}
              >
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Panel */}
          {isNotifOpen && (
            <div
              style={{
                position: 'absolute',
                top: '46px',
                right: '0',
                width: '380px',
                maxHeight: '520px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-modal)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100,
                animation: 'fadeIn 0.15s ease-out'
              }}
            >
              <div
                style={{
                  padding: '16px 18px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-subtle)',
                  borderTopLeftRadius: '14px',
                  borderTopRightRadius: '14px'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Notifications
                  </h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {unreadNotificationsCount} unread alert{unreadNotificationsCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '4px 8px'
                      }}
                    >
                      <Check size={12} />
                      <span>Mark all read</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification Items List */}
              <div style={{ overflowY: 'auto', maxHeight: '420px', padding: '6px' }}>
                {isLoadingNotifications ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Loading alerts...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-subtle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px'
                      }}
                    >
                      <Bell size={20} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      All caught up!
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Milestones, submissions, and approvals will appear here.
                    </div>
                  </div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div
                      key={n.notification_id || n.id}
                      onClick={() => !n.is_read && markNotificationAsRead(n.notification_id || n.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: n.is_read ? 'transparent' : 'var(--accent-primary-subtle)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        marginBottom: '2px'
                      }}
                      onMouseEnter={(e) => {
                        if (n.is_read) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        if (n.is_read) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {getEventIcon(n.event_type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {n.time_ago || 'Recent'}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                            lineHeight: 1.4
                          }}
                        >
                          {n.message}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-primary)',
                            marginTop: '6px',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Action: New Deliverable / Campaign */}
        {activeRole !== 'client' && (
          <button
            onClick={onOpenNewCampaign}
            className="btn-primary"
            style={{ height: '38px', padding: '0 16px', fontSize: '13px' }}
          >
            <Plus size={15} />
            <span>New Deliverable</span>
          </button>
        )}

        {/* Profile / Settings Trigger */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="System & Profile Settings"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            <Sliders size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
