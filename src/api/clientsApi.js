import apiClient from './client';

export const clientsApi = {
  getClients: async (params = {}) => {
    const response = await apiClient.get('/clients', { params });
    return response.data;
  },

  getClientById: async (id) => {
    const response = await apiClient.get(`/clients/${id}`);
    return response.data;
  },

  createClient: async (data) => {
    const response = await apiClient.post('/clients', data);
    return response.data;
  },

  updateClient: async (id, data) => {
    const response = await apiClient.patch(`/clients/${id}`, data);
    return response.data;
  },
};

export default clientsApi;
