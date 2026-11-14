import apiClient from './client';

export const contentApi = {
  getContentItems: async (params = {}) => {
    const response = await apiClient.get('/content', { params });
    return response.data;
  },

  getContentItemById: async (contentId) => {
    const response = await apiClient.get(`/content/${contentId}`);
    return response.data;
  },

  submitDeliverable: async (formData) => {
    const response = await apiClient.post('/content/submissions', formData);
    return response.data;
  },

  updateContentItem: async (contentId, updateData) => {
    const response = await apiClient.patch(`/content/${contentId}`, updateData);
    return response.data;
  },
};

export default contentApi;
