import { apiClient } from './client';

export const financeApi = {
  // Invoices
  getInvoices: async (params = {}) => {
    const res = await apiClient.get('/invoices', { params });
    return res.data;
  },

  getInvoice: async (invoiceId) => {
    const res = await apiClient.get(`/invoices/${invoiceId}`);
    return res.data;
  },

  createInvoice: async (payload) => {
    const res = await apiClient.post('/invoices', payload);
    return res.data;
  },

  updateInvoice: async (invoiceId, payload) => {
    const res = await apiClient.patch(`/invoices/${invoiceId}`, payload);
    return res.data;
  },

  getInvoiceMetrics: async () => {
    const res = await apiClient.get('/invoices/summary/metrics');
    return res.data;
  },

  // Payments
  getInvoicePayments: async (invoiceId) => {
    const res = await apiClient.get(`/invoices/${invoiceId}/payments`);
    return res.data;
  },

  recordInvoicePayment: async (invoiceId, payload) => {
    const res = await apiClient.post(`/invoices/${invoiceId}/payments`, payload);
    return res.data;
  },

  getPayments: async (params = {}) => {
    const res = await apiClient.get('/payments', { params });
    return res.data;
  },

  // Expenses
  getExpenses: async (params = {}) => {
    const res = await apiClient.get('/expenses', { params });
    return res.data;
  },

  getExpense: async (expenseId) => {
    const res = await apiClient.get(`/expenses/${expenseId}`);
    return res.data;
  },

  createExpense: async (payload) => {
    const res = await apiClient.post('/expenses', payload);
    return res.data;
  },

  updateExpense: async (expenseId, payload) => {
    const res = await apiClient.patch(`/expenses/${expenseId}`, payload);
    return res.data;
  },

  deleteExpense: async (expenseId) => {
    const res = await apiClient.delete(`/expenses/${expenseId}`);
    return res.data;
  },

  getExpenseMetrics: async () => {
    const res = await apiClient.get('/expenses/summary/metrics');
    return res.data;
  }
};
