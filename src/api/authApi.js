import apiClient from './client';

export const authApi = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
      remember_device: true
    });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
  }
};

export default authApi;
