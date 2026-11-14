import { apiClient } from './client';

export const notificationsApi = {
  getNotifications: async (unreadOnly = false) => {
    const res = await apiClient.get('/notifications', {
      params: { unread_only: unreadOnly }
    });
    return res.data;
  },

  markAsRead: async (notificationId) => {
    const res = await apiClient.patch(`/notifications/${notificationId}`, { is_read: true });
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.post('/notifications/mark-all-read');
    return res.data;
  }
};

export default notificationsApi;

