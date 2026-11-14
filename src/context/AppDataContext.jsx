import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import clientsApi from '../api/clientsApi';
import employeesApi from '../api/employeesApi';
import tasksApi from '../api/tasksApi';
import contentApi from '../api/contentApi';
import approvalsApi from '../api/approvalsApi';
import { financeApi } from '../api/financeApi';
import activityLogsApi from '../api/activityLogsApi';
import notificationsApi from '../api/notificationsApi';
import { normalizePlatform, getPlatformMeta } from '../constants/platforms';
import {
  initialClients,
  initialEmployees,
  initialApprovals,
  initialComplianceSignoffs,
  initialKanbanTasks,
  initialCalendarEvents,
  initialInvoices,
  initialExpenses,
  initialActivityLogs,
  initialWorkloadTeam,
  initialContentRequests
} from '../data/mockData';

const AppDataContext = createContext();

export const useAppData = () => useContext(AppDataContext);

export const AppDataProvider = ({ children }) => {
  // Purge legacy demo cache if present on client
  if (typeof window !== 'undefined' && localStorage.getItem('so_clean_v3') !== 'true') {
    [
      'so_clients', 'so_employees', 'so_approvals', 'so_compliance',
      'so_tasks', 'so_calendar', 'so_invoices', 'so_expenses',
      'so_activity', 'so_workload', 'so_content_requests'
    ].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('so_clean_v3', 'true');
  }

  // Primary datasets initialized with clean defaults
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem('so_clients');
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('so_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [approvals, setApprovals] = useState(() => {
    const saved = localStorage.getItem('so_approvals');
    return saved ? JSON.parse(saved) : initialApprovals;
  });

  const [complianceLogs, setComplianceLogs] = useState(() => {
    const saved = localStorage.getItem('so_compliance');
    return saved ? JSON.parse(saved) : initialComplianceSignoffs;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('so_tasks');
    return saved ? JSON.parse(saved) : initialKanbanTasks;
  });

  const [calendarEvents, setCalendarEvents] = useState(() => {
    const saved = localStorage.getItem('so_calendar');
    return saved ? JSON.parse(saved) : initialCalendarEvents;
  });

  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem('so_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('so_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [financeMetrics, setFinanceMetrics] = useState({
    total_billed: 0,
    total_collected: 0,
    outstanding_receivables: 0,
    overdue_amount: 0,
    overdue_invoices_count: 0
  });

  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('so_activity');
    return saved ? JSON.parse(saved) : initialActivityLogs;
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingActivityLogs, setIsLoadingActivityLogs] = useState(false);

  const [workloadTeam, setWorkloadTeam] = useState(() => {
    const saved = localStorage.getItem('so_workload');
    return saved ? JSON.parse(saved) : initialWorkloadTeam;
  });

  const [contentRequests, setContentRequests] = useState(() => {
    const saved = localStorage.getItem('so_content_requests');
    return saved ? JSON.parse(saved) : initialContentRequests;
  });

  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [submissions, setSubmissions] = useState([]);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('so_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('so_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('so_approvals', JSON.stringify(approvals));
  }, [approvals]);

  useEffect(() => {
    localStorage.setItem('so_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('so_calendar', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('so_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('so_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('so_activity', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('so_workload', JSON.stringify(workloadTeam));
  }, [workloadTeam]);

  useEffect(() => {
    localStorage.setItem('so_content_requests', JSON.stringify(contentRequests));
  }, [contentRequests]);

  // Check backend health and fetch initial database records
  const fetchClients = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const data = await clientsApi.getClients();
      if (Array.isArray(data) && data.length > 0) {
        setClients(data);
      }
    } catch (err) {
      console.warn("Using cached clients roster:", err.message);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const data = await employeesApi.getEmployees();
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
      }
    } catch (err) {
      console.warn("Using cached employees roster (or role restricted):", err.message);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const data = await tasksApi.getTasks();
      if (Array.isArray(data) && data.length > 0) {
        setTasks(data);
      }
    } catch (err) {
      console.warn("Using cached tasks:", err.message);
    }
  }, []);

  const fetchWorkload = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const data = await tasksApi.getWorkload();
      if (data && Array.isArray(data.operatives) && data.operatives.length > 0) {
        setWorkloadTeam(data.operatives);
      }
    } catch (err) {
      console.warn("Using cached workload metrics (or role restricted):", err.message);
    }
  }, []);

  const fetchApprovals = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const data = await approvalsApi.getApprovals();
      if (Array.isArray(data) && data.length > 0) {
        setApprovals(data);
      }
    } catch (err) {
      console.warn("Using cached approvals queue:", err.message);
    }
  }, []);

  const fetchSubmissions = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const data = await contentApi.getContentItems();
      if (Array.isArray(data) && data.length > 0) {
        setSubmissions(data);
      }
    } catch (err) {
      console.warn("Using cached submissions:", err.message);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const data = await financeApi.getInvoices();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(inv => ({
          id: inv.invoice_number,
          dbId: inv.invoice_id,
          client: inv.client_name,
          initials: inv.client_initials || 'CL',
          issueDate: inv.issue_date,
          dueDate: inv.due_date,
          amount: Number(inv.total_amount),
          subtotal: Number(inv.subtotal),
          taxAmount: Number(inv.tax_amount),
          paidAmount: Number(inv.paid_amount),
          balanceDue: Number(inv.balance_due),
          paymentMethod: inv.payment_method || 'Stripe ACH',
          status: inv.status,
          notes: inv.notes,
          paymentsCount: inv.payments_count
        }));
        setInvoices(mapped);
      }
    } catch (err) {
      console.warn("Using cached invoices ledger:", err.message);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const data = await financeApi.getExpenses();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(exp => ({
          id: `EXP-${exp.expense_id}`,
          dbId: exp.expense_id,
          date: exp.expense_date,
          description: exp.description,
          details: exp.details || '',
          category: exp.category,
          clientAccount: exp.client_handle,
          paymentMethod: exp.payment_method || 'Amex Corp •• 4910',
          receipt: exp.receipt_url || 'Pending',
          amount: Number(exp.amount),
          status: exp.status
        }));
        setExpenses(mapped);
      }
    } catch (err) {
      console.warn("Using cached expenses ledger (or role restricted):", err.message);
    }
  }, []);

  const fetchFinanceMetrics = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      const metrics = await financeApi.getInvoiceMetrics();
      if (metrics) {
        setFinanceMetrics(metrics);
      }
    } catch (err) {
      // Role restricted for clients
    }
  }, []);

  const fetchActivityLogs = useCallback(async (params = {}) => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      setIsLoadingActivityLogs(true);
      const data = await activityLogsApi.getActivityLogs(params);
      if (Array.isArray(data)) {
        setActivityLogs(data);
      }
    } catch (err) {
      console.warn("Using cached activity logs (or role restricted):", err.message);
    } finally {
      setIsLoadingActivityLogs(false);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('socialops_token');
    if (!token) return;
    try {
      setIsLoadingNotifications(true);
      const data = await notificationsApi.getNotifications();
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadNotificationsCount(data.unread_count || 0);
      }
    } catch (err) {
      console.warn("Could not fetch notifications:", err.message);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await apiClient.get('/health', { timeout: 2000 });
        if (res.status === 200) {
          setIsBackendConnected(true);
          await Promise.allSettled([
            fetchClients(),
            fetchEmployees(),
            fetchTasks(),
            fetchWorkload(),
            fetchApprovals(),
            fetchSubmissions(),
            fetchInvoices(),
            fetchExpenses(),
            fetchFinanceMetrics(),
            fetchActivityLogs(),
            fetchNotifications()
          ]);
        }
      } catch (e) {
        setIsBackendConnected(false);
      }
    };
    checkBackend();
  }, [fetchClients, fetchEmployees, fetchTasks, fetchWorkload, fetchApprovals, fetchSubmissions, fetchInvoices, fetchExpenses, fetchFinanceMetrics, fetchActivityLogs, fetchNotifications]);



  // Log activity helper
  const addActivityLog = (actorName, actorRole, action, target, subtext, actionType = 'primary') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const newLog = {
      id: `LOG-${Date.now()}`,
      time: timeStr,
      date: 'Today, Just now',
      actorName,
      actorRole,
      avatar: null,
      initials: actorName.split(' ').map(n => n[0]).join(''),
      action,
      actionType,
      target,
      subtext,
      ip: '127.0.0.1 (Local)',
      clientEnv: 'Active Web Client'
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Content Submission (Phase 4: Manually shared Google Drive URL)
  const submitContentDeliverable = async (formData) => {
    const targetPlatformId = normalizePlatform(formData.platform || formData.targetPlatform);
    const platformMeta = getPlatformMeta(targetPlatformId);
    const targetFormat = formData.targetFormat || formData.format || formData.targetPlatform || 'Reel 9:16';

    try {
      if (isBackendConnected) {
        const payload = {
          client: formData.client,
          content_type: targetFormat,
          platform: targetPlatformId,
          driveUrl: formData.driveUrl,
          caption: formData.caption,
          hashtags: formData.hashtags,
          internalNotes: formData.internalNotes
        };
        const created = await contentApi.submitDeliverable(payload);
        setSubmissions(prev => [created, ...prev]);
        await fetchApprovals();
        addActivityLog('Creative Staff', 'Production Specialist', 'Deliverable Submitted', `${created.format} - ${created.client}`, `Linked Cloud URL: ${formData.driveUrl ? 'Valid Google Drive' : 'Direct Link'}`);
        return created.id;
      }
    } catch (err) {
      console.warn("Backend deliverable submission failed, using local persistence:", err.message);
    }

    const subId = `SUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSub = {
      id: subId,
      client: formData.client || 'Client Account',
      platform: platformMeta.shortName,
      format: targetFormat,
      storagePlatform: formData.storagePlatform || 'Google Drive',
      driveUrl: formData.driveUrl || '',
      caption: formData.caption || '',
      hashtags: formData.hashtags || '',
      internalNotes: formData.internalNotes || '',
      status: 'Needs Internal Review',
      submittedAt: 'Today, Just now'
    };

    setSubmissions(prev => [newSub, ...prev]);

    // Also push into Approval Queue
    const newApproval = {
      id: `APP-${Math.floor(200 + Math.random() * 800)}`,
      client: (formData.client || 'Brand Account').toUpperCase(),
      format: targetFormat,
      slaRemaining: '24h 00m left',
      slaUrgent: false,
      status: 'Needs Internal Review',
      category: 'Needs Internal Review',
      title: formData.caption?.slice(0, 40) || 'New Deliverable Submission',
      description: formData.caption || 'New submitted campaign asset awaiting review.',
      submittedDate: 'Today, Just now',
      leadCreator: 'Current Operator',
      qaStatus: '100% Passed',
      qaType: 'success',
      revisionCycle: 'v1',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      mediaDuration: 'Asset Proof',
      driveUrl: formData.driveUrl || 'https://drive.google.com'
    };
    setApprovals(prev => [newApproval, ...prev]);

    addActivityLog('Creative Staff', 'Production Specialist', 'Deliverable Submitted', `${newSub.platform} - ${newSub.client}`, `Linked Cloud URL: ${formData.driveUrl ? 'Valid Google Drive' : 'Direct Link'}`);

    return subId;
  };

  // Approval actions: Approve or Request Changes
  const reviewApprovalItem = async (approvalId, decision, feedbackNotes = '') => {
    // Optimistic UI update
    const previousApprovals = [...approvals];
    setApprovals(prev =>
      prev.map(item => {
        if (item.id === approvalId) {
          const isApprove = decision === 'Approved';
          return {
            ...item,
            status: isApprove ? 'Approved' : 'Urgent Changes Requested',
            category: isApprove ? 'Approved' : 'Urgent Changes Requested',
            feedback: feedbackNotes,
            revisionCycle: isApprove ? item.revisionCycle : `v${parseInt(item.revisionCycle?.replace('v', '') || 1) + 1}`
          };
        }
        return item;
      })
    );

    try {
      if (isBackendConnected) {
        await approvalsApi.reviewApproval(approvalId, {
          decision,
          feedbackNotes
        });
        await fetchApprovals();
      }
    } catch (err) {
      console.warn("Backend approval review failed, rolling back:", err.message);
      setApprovals(previousApprovals);
    }

    // Record signoff in compliance ledger
    const targetItem = approvals.find(a => a.id === approvalId);
    if (targetItem) {
      const newSignoff = {
        id: `#SIG-${Math.floor(10000 + Math.random() * 90000)}`,
        deliverable: targetItem.title,
        authorizer: 'Prathamesh Nehere (Platform Admin)',
        decision: decision === 'Approved' ? 'Approved (Signed)' : 'Revision Enforced',
        timestamp: 'Just now',
        hash: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`
      };
      setComplianceLogs(prev => [newSignoff, ...prev]);

      addActivityLog(
        'Prathamesh Nehere',
        'Platform Admin',
        decision === 'Approved' ? 'Content Approved' : 'Revisions Requested',
        targetItem.title,
        `Deliverable: ${targetItem.client} • Feedback: ${feedbackNotes || 'Standard Signoff'}`,
        decision === 'Approved' ? 'success' : 'danger'
      );
    }
  };


  // Kanban Tasks
  const addTask = async (taskData) => {
    try {
      if (isBackendConnected) {
        const payload = {
          title: taskData.title,
          client: taskData.client,
          assignee: taskData.assignee,
          channel: taskData.channel || 'Instagram',
          priority: taskData.priority || 'Medium',
          stage: taskData.stage || 'To Do',
          estimated_hours: Number(taskData.estimated_hours) || 4.0,
          description: taskData.description || `${taskData.channel || 'Social'} content production deliverable.`
        };
        const created = await tasksApi.createTask(payload);
        setTasks(prev => [created, ...prev]);
        addActivityLog('Prathamesh Nehere', 'Admin', 'Task Created', created.title, `Client: ${created.client}`);
        fetchWorkload();
        return created;
      }
    } catch (err) {
      console.warn("Backend task creation failed, using local persistence:", err.message);
    }

    const newTask = {
      id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
      stage: 'To Do',
      ...taskData
    };
    setTasks(prev => [newTask, ...prev]);
    addActivityLog('Prathamesh Nehere', 'Admin', 'Task Created', taskData.title, `Client: ${taskData.client}`);
    return newTask;
  };

  const updateTaskStage = async (taskId, newStage) => {
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, stage: newStage, status: newStage } : t))
    );

    try {
      if (isBackendConnected) {
        await tasksApi.updateTask(taskId, { stage: newStage });
        fetchWorkload();
      }
    } catch (err) {
      console.warn("Backend stage update failed, rolling back:", err.message);
      setTasks(previousTasks);
    }
  };


  // Calendar
  const addCalendarEvent = (event) => {
    const newEvt = {
      id: `EVT-${Date.now()}`,
      day: parseInt(event.day) || 24,
      ...event
    };
    setCalendarEvents(prev => [...prev, newEvt]);
    addActivityLog('Campaign Coordinator', 'Staff', 'Content Scheduled', event.title, `${event.platform} on Day ${event.day}`);
  };

  const rescheduleCalendarEvent = (eventIdOrTitle, newDate, newTime) => {
    let day = 1;
    let eventYear = 2026;
    let eventMonth = 10;
    if (newDate) {
      const parts = newDate.split('-').map(Number);
      if (parts.length === 3) {
        eventYear = parts[0];
        eventMonth = parts[1] - 1;
        day = parts[2];
      }
    }

    setCalendarEvents(prev =>
      prev.map(evt => {
        const matches = (evt.id && evt.id === eventIdOrTitle) || evt.title === eventIdOrTitle;
        if (!matches) return evt;
        return {
          ...evt,
          date: newDate,
          time: newTime || evt.time || '12:00',
          day,
          month: eventMonth,
          year: eventYear,
          status: evt.status === 'Draft' ? 'Scheduled' : evt.status
        };
      })
    );
    addActivityLog('Campaign Coordinator', 'Staff', 'Content Rescheduled', String(eventIdOrTitle), `Rescheduled to ${newDate} at ${newTime || '12:00'}`);
  };

  // Client Business Profile Updates
  const updateClientProfile = (clientIdOrName, updatedFields) => {
    setClients(prev => {
      const exists = prev.some(c => 
        (c.id && String(c.id) === String(clientIdOrName)) ||
        (c.account_id && String(c.account_id) === String(clientIdOrName)) ||
        c.name === clientIdOrName ||
        c.business_name === clientIdOrName
      );

      let nextClients;
      if (!exists) {
        const newClient = {
          id: String(clientIdOrName || Date.now()),
          account_id: Number(clientIdOrName) || Date.now(),
          name: updatedFields.business_name || updatedFields.name || 'Client Brand',
          business_name: updatedFields.business_name || updatedFields.name || 'Client Brand',
          ...updatedFields
        };
        nextClients = [...prev, newClient];
      } else {
        nextClients = prev.map(c => {
          const matches = (c.id && String(c.id) === String(clientIdOrName)) ||
                          (c.account_id && String(c.account_id) === String(clientIdOrName)) ||
                          c.name === clientIdOrName ||
                          c.business_name === clientIdOrName;
          if (!matches) return c;
          return {
            ...c,
            ...updatedFields,
            name: updatedFields.business_name || updatedFields.name || c.name,
            business_name: updatedFields.business_name || updatedFields.name || c.business_name || c.name
          };
        });
      }
      localStorage.setItem('so_clients', JSON.stringify(nextClients));
      return nextClients;
    });

    addActivityLog('Client Representative', 'Profile', 'Business Profile Updated', String(clientIdOrName), 'Updated business information & social handles');
  };

  // Content Request Lifecycle Management
  const createContentRequest = (requestData) => {
    const newReq = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      assignedEmployee: null,
      googleDriveUrl: null,
      deliveredAssetDescription: null,
      clientFeedback: null,
      approvalHistory: [
        {
          action: 'Submitted',
          by: requestData.client || 'Client Account',
          timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          notes: 'Client submitted content requirements.'
        }
      ],
      ...requestData
    };

    setContentRequests(prev => [newReq, ...prev]);
    addActivityLog(requestData.client || 'Client', 'Content Request', 'Request Created', newReq.title, `Topic: ${requestData.contentTopic || 'General'} • Deadline: ${requestData.submissionDeadline || 'TBD'}`);
    return newReq;
  };

  const assignContentRequest = (requestId, employeeName) => {
    setContentRequests(prev =>
      prev.map(r => {
        if (r.id !== requestId) return r;
        const newHist = [
          ...(r.approvalHistory || []),
          {
            action: 'Assigned',
            by: 'Agency Admin',
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            notes: `Assigned to ${employeeName}`
          }
        ];
        return {
          ...r,
          assignedEmployee: employeeName,
          status: 'Assigned',
          approvalHistory: newHist
        };
      })
    );
    addActivityLog('Agency Admin', 'Staff', 'Request Assigned', `Request #${requestId}`, `Assigned to ${employeeName}`);
  };

  const updateContentRequestStatus = (requestId, newStatus, notes = '') => {
    setContentRequests(prev =>
      prev.map(r => {
        if (r.id !== requestId) return r;
        const newHist = [
          ...(r.approvalHistory || []),
          {
            action: newStatus,
            by: 'Operations Lead',
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            notes: notes || `Status changed to ${newStatus}`
          }
        ];
        return {
          ...r,
          status: newStatus,
          approvalHistory: newHist
        };
      })
    );
    addActivityLog('Operations Lead', 'Workflow', 'Status Transition', `Request #${requestId}`, `Moved to ${newStatus}`);
  };

  const submitContentForRequest = (requestId, submissionData) => {
    const { googleDriveUrl, deliveredAssetDescription, platform, format } = submissionData;
    let targetReq = null;

    setContentRequests(prev =>
      prev.map(r => {
        if (r.id !== requestId) return r;
        targetReq = r;
        const newHist = [
          ...(r.approvalHistory || []),
          {
            action: 'Submitted for Approval',
            by: r.assignedEmployee || 'Creative Staff',
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            notes: 'Proof uploaded to Google Drive and staged for review.'
          }
        ];
        return {
          ...r,
          googleDriveUrl,
          deliveredAssetDescription,
          status: 'Submitted for Approval',
          approvalHistory: newHist
        };
      })
    );

    // Also stage into approvals queue
    const newApprovalItem = {
      id: `APP-${Date.now()}`,
      title: targetReq ? targetReq.title : 'Deliverable Proof',
      client: targetReq ? targetReq.client : 'Client Brand',
      platform: platform || (targetReq && targetReq.platforms && targetReq.platforms[0]) || 'Instagram',
      format: format || (targetReq && targetReq.formats && targetReq.formats[0]) || 'Reel 9:16',
      driveUrl: googleDriveUrl,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
      status: 'Client Review Required',
      submittedAt: 'Today, Just now',
      caption: deliveredAssetDescription || (targetReq ? targetReq.mainMessage : 'Creative deliverable ready for sign-off.'),
      complianceHash: `0x${Math.random().toString(16).substring(2, 10)}`,
      requestId: requestId
    };
    setApprovals(prev => [newApprovalItem, ...prev]);

    addActivityLog(targetReq?.assignedEmployee || 'Creative Staff', 'Workflow', 'Deliverable Staged', `Request #${requestId}`, `Drive Proof: ${googleDriveUrl}`);
  };

  const reviewContentRequest = (requestId, decision, feedback = '') => {
    setContentRequests(prev =>
      prev.map(r => {
        if (r.id !== requestId) return r;
        const newHist = [
          ...(r.approvalHistory || []),
          {
            action: decision,
            by: 'Client Reviewer',
            timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            notes: decision === 'Approved' ? 'Client approved the deliverable.' : `Changes requested: ${feedback}`
          }
        ];
        return {
          ...r,
          status: decision === 'Approved' ? 'Approved' : 'Changes Requested',
          clientFeedback: decision === 'Changes Requested' ? feedback : null,
          approvalHistory: newHist
        };
      })
    );

    // Also update approvals list
    setApprovals(prev =>
      prev.map(a => {
        if (a.requestId === requestId) {
          return {
            ...a,
            status: decision === 'Approved' ? 'Approved' : 'Urgent Changes Requested',
            feedback: decision === 'Changes Requested' ? feedback : null
          };
        }
        return a;
      })
    );

    addActivityLog('Client Reviewer', 'Signoff', `Decision: ${decision}`, `Request #${requestId}`, feedback || 'Asset verified');
  };

  // Workload auto-rebalance
  const autoRebalanceWorkload = () => {
    setWorkloadTeam(prev =>
      prev.map(member => {
        if (member.utilization > 100) {
          // Rebalance to 88% safe threshold
          return {
            ...member,
            allocatedHours: 35,
            utilization: 88,
            status: 'Opt'
          };
        }
        if (member.utilization < 65) {
          // Backfill available member
          return {
            ...member,
            allocatedHours: 32,
            utilization: 80,
            status: 'Opt'
          };
        }
        return member;
      })
    );
    addActivityLog('System Daemon', 'Resource Engine', 'Workload Auto-Rebalanced', 'Agency Team Matrix', 'Rebalanced Marcus Chen & Maya Vance down to 88% safe threshold', 'success');
  };

  // Clients
  const addClient = async (clientData) => {
    try {
      if (isBackendConnected) {
        const matchedEmp = employees.find(e => 
          (e.name && e.name.toLowerCase() === (clientData.accountLead || '').toLowerCase()) ||
          (e.full_name && e.full_name.toLowerCase() === (clientData.accountLead || '').toLowerCase())
        );

        const payload = {
          business_name: clientData.name,
          industry: clientData.sector || 'Consumer Tech',
          brand_description: clientData.brandDescription || '',
          contact_person: clientData.contactPerson || '',
          email: `${clientData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@clientbrand.com`,
          username: `${clientData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_admin`,
          tier: clientData.tier || 'Growth Acceleration',
          account_manager_employee_id: matchedEmp ? (matchedEmp.account_id || matchedEmp.id) : null,
          monthly_retainer: Number(clientData.monthlyRetainer) || 15000
        };
        const created = await clientsApi.createClient(payload);
        setClients(prev => [created, ...prev]);
        addActivityLog('Prathamesh Nehere', 'Admin', 'Client Onboarded', created.name, `Retainer: ₹${Number(created.monthlyRetainer).toLocaleString('en-IN')}/mo`);
        return created;
      }
    } catch (err) {
      console.warn("Backend client creation failed, using local persistence:", err.message);
    }

    const newClient = {
      id: String(Math.floor(1000 + Math.random() * 9000)),
      code: `CLIENT-ID #${Math.floor(1000 + Math.random() * 9000)}`,
      initials: clientData.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      activeCampaignsCount: 1,
      activeAssetsCount: 3,
      renewalDate: 'Nov 30, 2025',
      healthScore: 95,
      healthStatus: 'Health',
      contact_person: clientData.contactPerson || '',
      brand_description: clientData.brandDescription || '',
      ...clientData
    };
    setClients(prev => [newClient, ...prev]);
    addActivityLog('Prathamesh Nehere', 'Admin', 'Client Onboarded', clientData.name, `Retainer: ₹${Number(clientData.monthlyRetainer).toLocaleString('en-IN')}/mo`);
    return newClient;
  };

  // Employees
  const addEmployee = async (empData) => {
    try {
      if (isBackendConnected) {
        const payload = {
          full_name: empData.name,
          email: empData.email || `${empData.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@socialflow.co`,
          username: empData.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          phone: "+1 (555) 000-0000",
          joining_date: new Date().toISOString().split('T')[0],
          department: empData.department || 'Creative Dept',
          job_title: empData.role || 'Production Specialist',
          access_level: 'standard',
          billable_rate: Number(empData.billableRate) || 120.00,
          max_weekly_hours: Number(empData.maxHours) || 40
        };
        const created = await employeesApi.createEmployee(payload);
        setEmployees(prev => [created, ...prev]);
        addActivityLog('Prathamesh Nehere', 'Admin', 'Staff Roster Updated', `Added ${created.name}`, `${created.role} • ${created.department}`);
        return created;
      }
    } catch (err) {
      console.warn("Backend employee creation failed, using local persistence:", err.message);
    }

    const newEmp = {
      id: `EMP-0${Math.floor(100 + Math.random() * 900)}`,
      workloadPercent: 50,
      weeklyHours: 20,
      maxHours: 40,
      status: 'Active',
      assignedAccounts: ['@NewAccount'],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      ...empData
    };
    setEmployees(prev => [newEmp, ...prev]);
    addActivityLog('Prathamesh Nehere', 'Admin', 'Staff Roster Updated', `Added ${empData.name}`, `${empData.role} • ${empData.department}`);
    return newEmp;
  };

  // Invoices
  const createInvoice = async (inv) => {
    try {
      if (isBackendConnected) {
        const matchedClient = clients.find(c => c.name === inv.client || c.business_name === inv.client);
        const clientId = matchedClient ? (matchedClient.account_id || matchedClient.id) : null;

        if (clientId) {
          const payload = {
            client_account_id: Number(clientId),
            subtotal: Number(inv.amount),
            tax_percent: 0.00,
            due_date: inv.dueDate,
            payment_method: inv.paymentMethod || 'Stripe ACH',
            notes: inv.notes || 'Agency retainer service billing'
          };
          const created = await financeApi.createInvoice(payload);
          await fetchInvoices();
          await fetchFinanceMetrics();
          addActivityLog('Finance Team', 'Ledger Admin', 'Invoice Issued', `${created.invoice_number} to ${inv.client}`, `₹${Number(created.total_amount).toLocaleString('en-IN')}`);
          return created;
        }
      }
    } catch (err) {
      console.warn("Backend invoice creation failed, falling back to local state:", err.message);
    }

    const newInv = {
      id: `INV-2024-0${Math.floor(90 + Math.random() * 10)}`,
      initials: inv.client.slice(0, 2).toUpperCase(),
      issueDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      ...inv
    };
    setInvoices(prev => [newInv, ...prev]);
    addActivityLog('Finance Team', 'Ledger Admin', 'Invoice Issued', `${newInv.id} to ${inv.client}`, `₹${Number(inv.amount).toLocaleString('en-IN')}`);
    return newInv;
  };

  // Record Payment
  const recordPayment = async (invoiceId, paymentData) => {
    try {
      if (isBackendConnected) {
        const payload = {
          amount: Number(paymentData.amount),
          payment_method: paymentData.paymentMethod || 'Stripe ACH',
          transaction_reference: paymentData.transactionReference || `TX-${Date.now()}`,
          notes: paymentData.notes || 'Internal ledger payment settlement'
        };
        const recorded = await financeApi.recordInvoicePayment(invoiceId, payload);
        await fetchInvoices();
        await fetchFinanceMetrics();
        addActivityLog('Finance Controller', 'Reconciliation', 'Payment Recorded', `Invoice #${invoiceId}`, `₹${Number(recorded.amount).toLocaleString('en-IN')}`, 'success');
        return recorded;
      }
    } catch (err) {
      console.warn("Backend payment recording failed:", err.message);
      throw err;
    }
  };

  // Expenses
  const addExpense = async (exp) => {
    try {
      if (isBackendConnected) {
        let clientId = null;
        if (exp.clientAccount && exp.clientAccount !== 'Agency Internal') {
          const cleanName = exp.clientAccount.replace('@', '').toLowerCase();
          const matched = clients.find(c => (c.name || c.business_name || '').toLowerCase().replace(/\s+/g, '') === cleanName);
          if (matched) {
            clientId = matched.account_id || matched.id;
          }
        }

        const payload = {
          client_account_id: clientId ? Number(clientId) : null,
          category: exp.category || 'Software',
          description: exp.description,
          details: exp.details || '',
          amount: Number(exp.amount),
          payment_method: exp.paymentMethod || 'Amex Corp •• 4910',
          receipt_url: exp.receipt || 'receipt.pdf'
        };
        const created = await financeApi.createExpense(payload);
        await fetchExpenses();
        addActivityLog('Finance Controller', 'Ledger', 'Expense Logged', exp.description, `Category: ${exp.category} • ₹${Number(exp.amount).toLocaleString('en-IN')}`);
        return created;
      }
    } catch (err) {
      console.warn("Backend expense logging failed, falling back to local state:", err.message);
    }

    const newExp = {
      id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      date: 'Today, Just now',
      receipt: 'receipt_uploaded.pdf',
      ...exp
    };
    setExpenses(prev => [newExp, ...prev]);
    addActivityLog('Finance Controller', 'Ledger', 'Expense Logged', exp.description, `Category: ${exp.category} • ₹${Number(exp.amount).toLocaleString('en-IN')}`);
    return newExp;
  };

  return (
    <AppDataContext.Provider
      value={{
        clients,
        employees,
        approvals,
        complianceLogs,
        tasks,
        calendarEvents,
        invoices,
        expenses,
        financeMetrics,
        activityLogs,
        notifications,
        unreadNotificationsCount,
        isLoadingNotifications,
        isLoadingActivityLogs,
        workloadTeam,
        submissions,
        contentRequests,
        setContentRequests,
        isBackendConnected,
        submitContentDeliverable,
        reviewApprovalItem,
        addTask,
        updateTaskStage,
        addCalendarEvent,
        rescheduleCalendarEvent,
        updateClientProfile,
        createContentRequest,
        assignContentRequest,
        updateContentRequestStatus,
        submitContentForRequest,
        reviewContentRequest,
        autoRebalanceWorkload,
        addClient,
        addEmployee,
        fetchClients,
        fetchEmployees,
        fetchTasks,
        fetchWorkload,
        fetchApprovals,
        fetchSubmissions,
        fetchInvoices,
        fetchExpenses,
        fetchFinanceMetrics,
        fetchActivityLogs,
        fetchNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        createInvoice,
        recordPayment,
        addExpense,
        addActivityLog
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
