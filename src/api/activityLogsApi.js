import { apiClient } from './client';

export const activityLogsApi = {
  getActivityLogs: async (params = {}) => {
    const res = await apiClient.get('/activity-logs', { params });
    return res.data;
  },

  recordActivityLog: async (payload) => {
    const res = await apiClient.post('/activity-logs', payload);
    return res.data;
  }
};

export default activityLogsApi;

