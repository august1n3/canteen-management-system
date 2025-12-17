import axios, { AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../constants/config';

// Function to create protected routes
const createProtectedRequest = (config: AxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  
  logout: () =>
    api.post('/api/auth/logout', {}, createProtectedRequest({})),
  
  getCurrentUser: () =>
    api.get('/api/auth/me', createProtectedRequest({})),
  
  registerStudent: (data: {
    email: string;
    password: string;
    name: string;
    studentId: string;
  }) => api.post('/api/auth/register/student', data),
};

// Menu API endpoints
export const menuApi = {
  getMenuItems: (params?: {
    category?: string;
    available?: boolean;
    limit?: number;
    offset?: number;
  }) => api.get('/api/menu', { params }),
  
  getMenuItem: (id: string) =>
    api.get(`/api/menu/${id}`),
  
  createMenuItem: (data: any) =>
    api.post('/api/menu', data),
  
  updateMenuItem: (id: string, data: any) =>
    api.put(`/api/menu/${id}`, data),
  
  updateItemAvailability: (id: string, data: {
    stockLevel?: number;
    isAvailable?: boolean;
  }) => api.patch(`/api/menu/${id}/availability`, data),
  
  updateAvailability: (id: string, data: {
    stockLevel?: number;
    isAvailable?: boolean;
  }) => api.patch(`/api/menu/${id}/availability`, data),
  
  bulkUpdateAvailability: (updates: Array<{
    menuItemId: string;
    stockLevel?: number;
    isAvailable?: boolean;
  }>) => api.patch('/api/menu/bulk/availability', { updates }),
  
  deleteMenuItem: (id: string) =>
    api.delete(`/api/menu/${id}`),
};

// Order API endpoints
export const orderApi = {
  getOrders: (page: number, limit: number, p0: string | undefined, params?: {
    status?: string;
    limit?: number;
    offset?: number;
    date?: string;
}) => api.get('/api/orders', createProtectedRequest({ params })),
  
  getOrder: (id: string) =>
    api.get(`/api/orders/${id}`, createProtectedRequest({})),
  
  createOrder: (data: {
    items: Array<{
      menuItemId: string;
      quantity: number;
      specialInstructions?: string;
    }>;
    specialInstructions?: string;
  }) => api.post('/api/orders', data, createProtectedRequest({})),
  
  updateOrderStatus: (id: string, data: {
    status: string;
    notes?: string;
  }) => api.patch(`/api/orders/${id}/status`, data, createProtectedRequest({})),
  
  cancelOrder: (id: string, reason?: string) =>
    api.patch(`/api/orders/${id}/cancel`, { reason }, createProtectedRequest({})),
  
  getOrderAnalytics: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/api/orders/analytics/summary', createProtectedRequest({ params })),
};

// Payment API endpoints
export const paymentApi = {
  updatePaymentStatus: (paymentId: string, status: string) =>
    api.patch(`/api/payments/${paymentId}/status`, { status }, createProtectedRequest({})),
  processRefund: (paymentId: string, amount: number, reason: string) =>
    api.post(`/api/payments/${paymentId}/refund`, { amount, reason }, createProtectedRequest({})),

  getPayments: (page: number, limit: number, params?: {
    status?: string;
    method?: string;
    limit?: number;
    offset?: number;
}) => api.get('/api/payments', createProtectedRequest({ params })),
  
  getPayment: (id: string) =>
    api.get(`/api/payments/${id}`, createProtectedRequest({})),
  
  processCashPayment: (data: {
    orderId: string;
    amountReceived: number;
    notes?: string;
  }) => api.post('/api/payments/cash', data, createProtectedRequest({})),
  
  initiateMobileMoneyPayment: (data: {
    orderId: string;
    phoneNumber: string;
    provider: string;
  }) => api.post('/api/payments/mobile-money', data, createProtectedRequest({})),
  
  verifyMobileMoneyPayment: (transactionId: string) =>
    api.get(`/api/payments/mobile-money/${transactionId}/verify`, createProtectedRequest({})),
  
  getPaymentAnalytics: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/api/payments/analytics/summary', createProtectedRequest({ params })),
};

// Queue API endpoints
export const queueApi = {
  getQueueStatus: (params?: { limit?: number }) =>
    api.get('/api/queue/status', createProtectedRequest({ params })),
  
  getOrderPosition: (orderId: string) =>
    api.get(`/api/queue/position/${orderId}`, createProtectedRequest({})),
  
  updateOrderPriority: (orderId: string, data: {
    priority: string;
    reason?: string;
  }) => api.patch(`/api/queue/priority/${orderId}`, data, createProtectedRequest({})),
  
  getQueueAnalytics: (params?: { date?: string }) =>
    api.get('/api/queue/analytics', createProtectedRequest({ params })),
  
  cleanupQueue: () =>
    api.post('/api/queue/cleanup', {}, createProtectedRequest({})),
};

// Reports API endpoints
export const reportsApi = {
  getDailySalesReport: (params?: { date?: string }) =>
    api.get('/api/reports/sales/daily', createProtectedRequest({ params })),
  
  getMonthlySalesReport: (params?: {
    month?: number;
    year?: number;
  }) => api.get('/api/reports/sales/monthly', createProtectedRequest({ params })),
  
  getInventoryReport: () =>
    api.get('/api/reports/inventory', createProtectedRequest({})),
  
  getCustomerReport: (params?: {
    startDate?: string;
    endDate?: string;
  }) => api.get('/api/reports/customers', createProtectedRequest({ params })),
  
  generateCustomReport: (data: {
    startDate: string;
    endDate: string;
    metrics: string[];
    groupBy?: string;
    filters?: any;
  }) => api.post('/api/reports/custom', data, createProtectedRequest({})),
};

// Export default axios instance for direct use if needed
export default api;

// TODO: Add request/response interceptors for error handling
// TODO: Implement request retry logic for failed requests
// TODO: Add request caching for frequently accessed data
// TODO: Implement request cancellation for component unmounting
// TODO: Add request timeout configuration per endpoint type