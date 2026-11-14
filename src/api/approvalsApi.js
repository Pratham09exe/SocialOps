import apiClient from './client';

export const approvalsApi = {
  getApprovals: async (params = {}) => {
    const response = await apiClient.get('/approvals', { params });
    return response.data;
  },

  reviewApproval: async (approvalId, decisionData) => {
    const cleanId = String(approvalId).replace('APP-', '');
    const response = await apiClient.post(`/approvals/${cleanId}/review`, decisionData);
    return response.data;
  },
};

export default approvalsApi;
