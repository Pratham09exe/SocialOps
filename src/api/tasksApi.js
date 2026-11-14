import apiClient from './client';

export const tasksApi = {
  getTasks: async (params = {}) => {
    const response = await apiClient.get('/tasks', { params });
    return response.data;
  },

  getTaskById: async (taskId) => {
    const response = await apiClient.get(`/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (taskId, updateData) => {
    const cleanId = String(taskId).replace('TSK-', '');
    const response = await apiClient.patch(`/tasks/${cleanId}`, updateData);
    return response.data;
  },

  getWorkload: async () => {
    const response = await apiClient.get('/workload');
    return response.data;
  },
};

export default tasksApi;
