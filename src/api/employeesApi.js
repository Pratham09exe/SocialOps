import apiClient from './client';

export const employeesApi = {
  getEmployees: async (params = {}) => {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  getEmployeeById: async (id) => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data) => {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  updateEmployee: async (id, data) => {
    const response = await apiClient.patch(`/employees/${id}`, data);
    return response.data;
  },
};

export default employeesApi;
