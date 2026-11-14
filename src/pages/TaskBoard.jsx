import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import {
  Kanban,
  ListFilter,
  Plus,
  SlidersHorizontal,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Filter,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { SOCIAL_PLATFORMS } from '../constants/platforms';

export default function TaskBoard() {
  const { tasks, updateTaskStage, addTask, clients, employees } = useAppData();
  const { user, activeRole } = useAuth();

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('All');
  const [teamFilter, setTeamFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState('To Do');

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskClient, setTaskClient] = useState(clients[0]?.name || '');
  const [taskAssignee, setTaskAssignee] = useState(employees[0]?.name || '');
  const [taskChannel, setTaskChannel] = useState('Instagram');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('Nov 20');

  const columns = ['To Do', 'In Progress', 'In Review', 'Completed'];

  const filteredTasks = tasks.filter((t) => {
    if (clientFilter !== 'All' && t.client !== clientFilter && t.client_name !== clientFilter) return false;
    if (teamFilter !== 'All' && t.assignee !== teamFilter && t.assignee_name !== teamFilter) return false;
    if (channelFilter !== 'All' && (t.channel || '').toLowerCase() !== channelFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchClient = (t.client || t.client_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchClient) return false;
    }
    return true;
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskTitle) return;

    addTask({
      title: taskTitle,
      client: taskClient,
      channel: taskChannel,
      priority: taskPriority,
      stage: targetColumn,
      assignee: taskAssignee,
      dueDate: taskDueDate || 'Nov 20',
      sla: '48h left'
    });

    setTaskTitle('');
    setIsTaskModalOpen(false);
  };

  const openCreateForColumn = (col) => {
    setTargetColumn(col);
    setIsTaskModalOpen(true);
  };

  const getPlatformMeta = (channelName = '') => {
    return SOCIAL_PLATFORMS.find(p => p.name.toLowerCase() === channelName.toLowerCase() || p.shortName.toLowerCase() === channelName.toLowerCase());
  };

  const getPriorityBadgeClass = (priority = 'Medium') => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'badge-danger';
      case 'medium':
        return 'badge-warning';
      case 'low':
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Operations & Deliverables Sprint"
        description="Track active creative tasks across production stages from concept through client signoff."
        badge={`${filteredTasks.length} Deliverables`}
        actions={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* View Mode Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12.5px',
                  fontWeight: viewMode === 'kanban' ? 600 : 500,
                  backgroundColor: viewMode === 'kanban' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'kanban' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'kanban' ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Kanban size={14} />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12.5px',
                  fontWeight: viewMode === 'list' ? 600 : 500,
                  backgroundColor: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                  color: viewMode === 'list' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  boxShadow: viewMode === 'list' ? 'var(--shadow-xs)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <ListFilter size={14} />
                <span>List View</span>
              </button>
            </div>

            {activeRole !== 'client' && (
              <button onClick={() => openCreateForColumn('To Do')} className="btn-primary">
                <Plus size={15} />
                <span>New Task</span>
              </button>
            )}
          </div>
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
              width: '230px'
            }}>
              <Search size={14} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search tasks or brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '12.5px',
                  width: '100%',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Client Filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
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

            {/* Team Filter */}
            {activeRole !== 'client' && (
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="saas-input"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px' }}
              >
                <option value="All">All Assignees</option>
                {employees.map(e => (
                  <option key={e.id || e.account_id} value={e.name || e.full_name}>
                    {e.name || e.full_name}
                  </option>
                ))}
              </select>
            )}

            {/* Channel Filters */}
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
              {['All', ...SOCIAL_PLATFORMS.map(p => p.shortName)].map(ch => {
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

          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Showing <strong>{filteredTasks.length}</strong> tasks
          </div>
        </div>
      </div>

      {/* =====================================================================
          KANBAN VIEW MODE
          ===================================================================== */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start' }}>
          {columns.map((column) => {
            const colTasks = filteredTasks.filter(t => (t.stage || t.status) === column);

            return (
              <div
                key={column}
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-subtle)',
                  padding: '14px',
                  minHeight: '620px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{column}</span>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '1px 7px',
                      borderRadius: 'var(--radius-pill)',
                      fontWeight: 600
                    }}>
                      {colTasks.length}
                    </span>
                  </div>
                  {activeRole !== 'client' && (
                    <button
                      onClick={() => openCreateForColumn(column)}
                      style={{
                        color: 'var(--text-muted)',
                        padding: '3px 6px',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      className="btn-ghost"
                      title={`Add task to ${column}`}
                    >
                      <Plus size={15} />
                    </button>
                  )}
                </div>

                {/* Column Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {colTasks.length === 0 ? (
                    <div style={{
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '36px 14px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      margin: 'auto 0'
                    }}>
                      No deliverables in {column}
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const pMeta = getPlatformMeta(task.channel);
                      return (
                        <div
                          key={task.id || task.task_id}
                          className="bento-card bento-interactive"
                          style={{
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          {/* Top Row: Client & Priority */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                              {task.client || task.client_name}
                            </span>
                            <span className={`badge ${getPriorityBadgeClass(task.priority)}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                              {task.priority || 'Medium'}
                            </span>
                          </div>

                          {/* Title */}
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {task.title}
                          </div>

                          {/* Platform & SLA */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                            <span className="platform-pill" style={{ borderColor: pMeta ? pMeta.color + '30' : 'var(--border-subtle)', fontSize: '10.5px', padding: '2px 7px' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: pMeta ? pMeta.color : '#6366F1' }} />
                              {task.channel || 'Instagram'}
                            </span>

                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={11} />
                              <span>{task.dueDate || 'Nov 15'}</span>
                            </span>
                          </div>

                          {/* Footer: Assignee & Stage Select */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', marginTop: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent-primary-subtle)',
                                color: 'var(--accent-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700
                              }}>
                                {(task.assignee || task.assignee_name || 'U').charAt(0)}
                              </span>
                              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                                {(task.assignee || task.assignee_name || 'Unassigned').split(' ')[0]}
                              </span>
                            </div>

                            {/* Move stage selector */}
                            {activeRole !== 'client' ? (
                              <select
                                value={task.stage || task.status || column}
                                onChange={(e) => updateTaskStage(task.id || task.task_id, e.target.value)}
                                className="saas-input"
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: 'var(--radius-sm)',
                                  width: 'auto'
                                }}
                              >
                                {columns.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                                {task.stage || task.status}
                              </span>
                            )}
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
      )}

      {/* =====================================================================
          MODERN LIST VIEW MODE
          ===================================================================== */}
      {viewMode === 'list' && (
        <div className="bento-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="saas-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="saas-table">
              <thead>
                <tr>
                  <th>DELIVERABLE TASK</th>
                  <th>CLIENT BRAND</th>
                  <th>PLATFORM</th>
                  <th>PRIORITY</th>
                  <th>STAGE / STATUS</th>
                  <th>ASSIGNEE</th>
                  <th>DUE DATE</th>
                  {activeRole !== 'client' && <th>ACTIONS</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={activeRole !== 'client' ? 8 : 7} style={{ textAlign: 'center', padding: '36px' }}>
                      <EmptyState title="No deliverables found" description="No tasks match the active filters." />
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const pMeta = getPlatformMeta(task.channel);
                    return (
                      <tr key={task.id || task.task_id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.id || `TSK-${task.task_id}`}</div>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                          {task.client || task.client_name}
                        </td>
                        <td>
                          <span className="platform-pill" style={{ borderColor: pMeta ? pMeta.color + '30' : 'var(--border-subtle)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: pMeta ? pMeta.color : '#6366F1' }} />
                            {task.channel || 'Instagram'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority || 'Medium'}
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
                              {task.assignee || task.assignee_name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{task.dueDate || task.due_date || 'Nov 15'}</span>
                        </td>
                        {activeRole !== 'client' && (
                          <td>
                            <select
                              value={task.stage || task.status || 'To Do'}
                              onChange={(e) => updateTaskStage(task.id || task.task_id, e.target.value)}
                              className="saas-input"
                              style={{
                                fontSize: '11.5px',
                                padding: '3px 8px',
                                width: 'auto',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              {columns.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={`Create New Sprint Deliverable`}
        subtitle={`Adding to column: ${targetColumn}`}
      >
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="saas-form-group">
            <label className="saas-label">Task Deliverable Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Brand Narrative Hero Reel"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="saas-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Client Account</label>
              <select
                value={taskClient}
                onChange={(e) => setTaskClient(e.target.value)}
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
              <label className="saas-label">Creative Assignee</label>
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="saas-input"
              >
                {employees.map(e => (
                  <option key={e.id || e.account_id} value={e.name || e.full_name}>
                    {e.name || e.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="saas-form-group">
              <label className="saas-label">Target Platform</label>
              <select
                value={taskChannel}
                onChange={(e) => setTaskChannel(e.target.value)}
                className="saas-input"
              >
                {SOCIAL_PLATFORMS.map(p => (
                  <option key={p.id} value={p.shortName}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="saas-form-group">
              <label className="saas-label">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="saas-input"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="saas-form-group">
            <label className="saas-label">Target Due Date</label>
            <input
              type="text"
              placeholder="e.g. Nov 24, 2026"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="saas-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create Deliverable
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
