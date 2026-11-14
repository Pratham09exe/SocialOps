import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { SOCIAL_PLATFORMS } from '../constants/platforms';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  List,
  Eye,
  Sparkles
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

export default function ContentCalendar() {
  const { calendarEvents, addCalendarEvent, rescheduleCalendarEvent, clients } = useAppData();
  const { activeRole } = useAuth();

  const [currentView, setCurrentView] = useState('Month'); // 'Month' | 'Week' | 'Day'
  const [selectedClient, setSelectedClient] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [inspectedEvent, setInspectedEvent] = useState(null);
  const [rescheduleModalEvent, setRescheduleModalEvent] = useState(null);
  const [newScheduleDate, setNewScheduleDate] = useState('');
  const [newScheduleTime, setNewScheduleTime] = useState('15:00');
  const [rescheduleNotice, setRescheduleNotice] = useState(null);

  // Month & year navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const formatLocalDate = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventClient, setEventClient] = useState(clients[0]?.name || clients[0]?.business_name || '');
  const [eventPlatform, setEventPlatform] = useState('Instagram');
  const [eventDate, setEventDate] = useState(() => formatLocalDate(new Date()));
  const [eventTime, setEventTime] = useState('15:00');
  const [eventStatus, setEventStatus] = useState('Scheduled');

  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Current year & month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Dynamic Calendar Day Grid Calculation (Monday-first)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  const calendarDays = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, d);
    const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      day: d,
      month: prevDate.getMonth(),
      year: prevDate.getFullYear(),
      dateStr,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      day: d,
      month,
      year,
      dateStr,
      isCurrentMonth: true
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const totalCells = Math.ceil(calendarDays.length / 7) * 7;
  const remaining = totalCells - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      day: d,
      month: nextDate.getMonth(),
      year: nextDate.getFullYear(),
      dateStr,
      isCurrentMonth: false
    });
  }

  // Event matching helper supporting both explicit dates and sample day numbers
  const isEventOnCell = (evt, cell) => {
    if (evt.date && cell.dateStr) {
      return evt.date === cell.dateStr;
    }
    if (evt.year !== undefined && evt.month !== undefined) {
      return evt.day === cell.day && evt.month === cell.month && evt.year === cell.year;
    }
    return cell.isCurrentMonth && evt.day === cell.day;
  };

  const handleOpenScheduleModal = (dateStrPrefill = null) => {
    if (dateStrPrefill) {
      setEventDate(dateStrPrefill);
    } else {
      const now = new Date();
      const dayToUse = (now.getFullYear() === year && now.getMonth() === month) ? now.getDate() : 15;
      setEventDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(dayToUse).padStart(2, '0')}`);
    }
    setIsScheduleModalOpen(true);
  };

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!eventTitle) return;

    let day = 1;
    let eventYear = year;
    let eventMonth = month;
    if (eventDate) {
      const parts = eventDate.split('-').map(Number);
      if (parts.length === 3) {
        eventYear = parts[0];
        eventMonth = parts[1] - 1;
        day = parts[2];
      }
    }

    addCalendarEvent({
      day,
      month: eventMonth,
      year: eventYear,
      date: eventDate,
      title: eventTitle,
      client: eventClient || (clients[0]?.name || clients[0]?.business_name || 'General Client'),
      platform: eventPlatform,
      status: eventStatus,
      time: eventTime
    });

    setEventTitle('');
    setIsScheduleModalOpen(false);
  };

  const handleOpenReschedule = (evt) => {
    setRescheduleModalEvent(evt);
    const existingDate = evt.date || `${evt.year || year}-${String((evt.month !== undefined ? evt.month : month) + 1).padStart(2, '0')}-${String(evt.day || 15).padStart(2, '0')}`;
    setNewScheduleDate(existingDate);
    setNewScheduleTime(evt.time || '15:00');
  };

  const handleConfirmReschedule = (e) => {
    e.preventDefault();
    if (!rescheduleModalEvent || !newScheduleDate) return;

    rescheduleCalendarEvent(rescheduleModalEvent.id || rescheduleModalEvent.title, newScheduleDate, newScheduleTime);
    setRescheduleNotice(`Deliverable "${rescheduleModalEvent.title}" rescheduled to ${newScheduleDate} at ${newScheduleTime}!`);
    setRescheduleModalEvent(null);
    setInspectedEvent(null);

    setTimeout(() => {
      setRescheduleNotice(null);
    }, 5000);
  };

  const filteredEvents = calendarEvents.filter((evt) => {
    if (selectedClient !== 'All' && evt.client !== selectedClient) return false;
    if (selectedStatus !== 'All' && evt.status !== selectedStatus) return false;
    return true;
  });

  const getPlatformMeta = (platformName = '') => {
    return SOCIAL_PLATFORMS.find(p => p.name.toLowerCase() === platformName.toLowerCase() || p.shortName.toLowerCase() === platformName.toLowerCase());
  };

  const realToday = new Date();
  const isCurrentViewingMonthToday = realToday.getFullYear() === year && realToday.getMonth() === month;

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Multi-Platform Publishing Schedule"
        description="Plan, stage, and schedule approved social campaigns across all connected brand handles."
        badge={`${filteredEvents.length} Scheduled Deliverables`}
        actions={
          activeRole !== 'client' && (
            <button onClick={() => handleOpenScheduleModal()} className="btn-primary">
              <Plus size={15} />
              <span>Schedule Post</span>
            </button>
          )
        }
      />

      {rescheduleNotice && (
        <div style={{
          backgroundColor: 'var(--success-subtle)',
          border: '1px solid var(--success-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCircle2 size={18} color="var(--success)" />
          <div style={{ fontSize: '13px', color: 'var(--success-text)', fontWeight: 600 }}>
            {rescheduleNotice}
          </div>
        </div>
      )}

      {/* Calendar Toolbar & Filter Bar */}
      <div className="bento-card" style={{ padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handlePrevMonth}
                className="btn-secondary"
                style={{ padding: '6px 9px', borderRadius: 'var(--radius-sm)' }}
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '160px', textAlign: 'center' }}>
                {monthName}
              </h2>
              <button
                onClick={handleNextMonth}
                className="btn-secondary"
                style={{ padding: '6px 9px', borderRadius: 'var(--radius-sm)' }}
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={handleToday}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Jump to Current Month"
            >
              <RotateCcw size={12} />
              <span>Today</span>
            </button>

            {/* Client Filter */}
            {activeRole !== 'client' && (
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
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

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="saas-input"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Published">Published</option>
              <option value="In Review">In Review</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          {/* View Mode Segment */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            {['Month', 'Week', 'Day'].map((v) => (
              <button
                key={v}
                onClick={() => setCurrentView(v)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: currentView === v ? 600 : 500,
                  backgroundColor: currentView === v ? 'var(--bg-surface)' : 'transparent',
                  color: currentView === v ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: currentView === v ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {v} View
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          1. MONTH VIEW
          ===================================================================== */}
      {currentView === 'Month' && (
        <div className="bento-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
          {/* Day Header Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            {daysOfWeek.map((day) => (
              <div key={day} style={{ padding: '12px 14px', textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: 'var(--border-subtle)', gap: '1px' }}>
            {calendarDays.map((cell, idx) => {
              const dayEvents = filteredEvents.filter(e => isEventOnCell(e, cell));
              const isToday = isCurrentViewingMonthToday && cell.isCurrentMonth && cell.day === realToday.getDate();

              return (
                <div
                  key={idx}
                  onClick={() => cell.isCurrentMonth && activeRole !== 'client' && handleOpenScheduleModal(cell.dateStr)}
                  style={{
                    backgroundColor: cell.isCurrentMonth ? 'var(--bg-surface)' : 'var(--bg-base)',
                    minHeight: '125px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: cell.isCurrentMonth && activeRole !== 'client' ? 'pointer' : 'default',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    if (cell.isCurrentMonth) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)';
                  }}
                  onMouseLeave={(e) => {
                    if (cell.isCurrentMonth) e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                  }}
                >
                  {/* Day Number Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{
                      fontSize: '12.5px',
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? '#FFFFFF' : cell.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                      backgroundColor: isToday ? 'var(--accent-primary)' : 'transparent',
                      width: isToday ? '24px' : 'auto',
                      height: isToday ? '24px' : 'auto',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {dayEvents.length} {dayEvents.length === 1 ? 'post' : 'posts'}
                      </span>
                    )}
                  </div>

                  {/* Events in Cell */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto', maxHeight: '130px' }}>
                    {dayEvents.map((evt, eIdx) => {
                      const pMeta = getPlatformMeta(evt.platform);
                      return (
                        <div
                          key={eIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectedEvent(evt);
                          }}
                          style={{
                            padding: '5px 8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)',
                            borderLeft: `3px solid ${pMeta ? pMeta.color : 'var(--accent-primary)'}`,
                            fontSize: '11px',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                          }}
                          title={`${evt.title} (${evt.client}) • Click to view`}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {evt.title}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <span>{evt.time || '12:00'}</span>
                            <span style={{ textTransform: 'capitalize' }}>{evt.platform}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          2. WEEK VIEW
          ===================================================================== */}
      {currentView === 'Week' && (
        <div className="bento-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '14px' }}>
            {daysOfWeek.map((dayName, idx) => {
              const weekDayNumber = idx + 1;
              const dayCell = calendarDays.find(c => c.isCurrentMonth && c.day === (idx + 18)) || calendarDays.find(c => c.isCurrentMonth && c.day === weekDayNumber);
              const dayEvents = dayCell ? filteredEvents.filter(e => isEventOnCell(e, dayCell)) : [];

              return (
                <div
                  key={dayName}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                    minHeight: '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)' }}>{dayName}</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {dayCell ? dayCell.day : weekDayNumber}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                    {dayEvents.length === 0 ? (
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textAlign: 'center', margin: 'auto' }}>
                        No posts scheduled
                      </span>
                    ) : (
                      dayEvents.map((evt, eIdx) => {
                        const pMeta = getPlatformMeta(evt.platform);
                        return (
                          <div
                            key={eIdx}
                            onClick={() => setInspectedEvent(evt)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-subtle)',
                              borderLeft: `3px solid ${pMeta ? pMeta.color : 'var(--accent-primary)'}`,
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{evt.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 500, marginTop: '2px' }}>{evt.client}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                              <span>{evt.time || '12:00'}</span>
                              <span className="badge badge-neutral" style={{ padding: '1px 6px', fontSize: '10px' }}>{evt.platform}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          3. DAY / AGENDA VIEW
          ===================================================================== */}
      {currentView === 'Day' && (
        <div className="bento-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Publishing Schedule & Stream</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>Chronological release queue</p>
            </div>
            <span className="badge badge-primary">{filteredEvents.length} Active Releases</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredEvents.length === 0 ? (
              <EmptyState title="No scheduled events" description="No social content is scheduled for this period." />
            ) : (
              filteredEvents.map((evt, idx) => {
                const pMeta = getPlatformMeta(evt.platform);
                return (
                  <div
                    key={idx}
                    onClick={() => setInspectedEvent(evt)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: pMeta ? pMeta.color + '15' : 'var(--accent-primary-subtle)',
                        color: pMeta ? pMeta.color : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}>
                        {evt.time || '15:00'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{evt.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>{evt.client}</span>
                          <span>&bull;</span>
                          <span className="platform-pill" style={{ padding: '1px 6px', fontSize: '10.5px' }}>{evt.platform}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${
                        evt.status === 'Published' ? 'badge-success' :
                        evt.status === 'Scheduled' ? 'badge-primary' : 'badge-warning'
                      }`}>
                        {evt.status}
                      </span>
                      {activeRole !== 'client' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReschedule(evt);
                          }}
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <RotateCcw size={12} />
                          <span>Reschedule</span>
                        </button>
                      )}
                      <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Schedule Post Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Social Deliverable"
        subtitle="Stage deliverable release on social calendar"
      >
        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Deliverable / Post Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Weekly Product Drop Announcement"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="saas-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Client Account</label>
              <select
                value={eventClient}
                onChange={(e) => setEventClient(e.target.value)}
                className="saas-input"
              >
                {clients.map(c => (
                  <option key={c.id || c.account_id} value={c.name || c.business_name}>
                    {c.name || c.business_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Target Platform</label>
              <select
                value={eventPlatform}
                onChange={(e) => setEventPlatform(e.target.value)}
                className="saas-input"
              >
                {SOCIAL_PLATFORMS.map(p => (
                  <option key={p.id} value={p.shortName}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Release Date</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="saas-input"
              />
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Publishing Time</label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="saas-input"
              />
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Status</label>
            <select
              value={eventStatus}
              onChange={(e) => setEventStatus(e.target.value)}
              className="saas-input"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="In Review">In Review</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Add to Calendar
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspect Event Modal */}
      {inspectedEvent && (
        <Modal
          isOpen={Boolean(inspectedEvent)}
          onClose={() => setInspectedEvent(null)}
          title="Scheduled Deliverable Details"
          subtitle={`Platform: ${inspectedEvent.platform}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{inspectedEvent.title}</h3>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Client: <strong>{inspectedEvent.client}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{inspectedEvent.platform}</span>
                <span className="badge badge-neutral">Time: {inspectedEvent.time || '15:00'}</span>
                <span className="badge badge-success">{inspectedEvent.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              {activeRole !== 'client' && (
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectedEvent;
                    setInspectedEvent(null);
                    handleOpenReschedule(target);
                  }}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}
                >
                  <RotateCcw size={13} />
                  <span>Reschedule Post</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectedEvent(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalEvent && (
        <Modal
          isOpen={Boolean(rescheduleModalEvent)}
          onClose={() => setRescheduleModalEvent(null)}
          title="Reschedule Publishing Date"
          subtitle={`Deliverable: ${rescheduleModalEvent.title}`}
        >
          <form onSubmit={handleConfirmReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-primary-subtle)',
              border: '1px solid var(--accent-primary-border)',
              fontSize: '12.5px',
              color: 'var(--text-primary)'
            }}>
              Currently scheduled for: <strong>{rescheduleModalEvent.date || `${monthName} Day ${rescheduleModalEvent.day}`}</strong> at <strong>{rescheduleModalEvent.time || '15:00'}</strong> ({rescheduleModalEvent.platform})
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="saas-form-group">
                <label className="saas-label">New Release Date</label>
                <input
                  type="date"
                  required
                  value={newScheduleDate}
                  onChange={(e) => setNewScheduleDate(e.target.value)}
                  className="saas-input"
                />
              </div>

              <div className="saas-form-group">
                <label className="saas-label">New Publishing Time</label>
                <input
                  type="time"
                  required
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="saas-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setRescheduleModalEvent(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                <RotateCcw size={14} />
                <span>Confirm Reschedule</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
