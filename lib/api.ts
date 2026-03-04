import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('erp_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      accessToken = parsed?.state?.accessToken || null;
    }
  } catch (e) {}
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const message = error.response?.data?.error?.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  switchCompany: (companySlug: string) =>
    api.post('/auth/switch-company', { companySlug }),
};

export const contactsApi = {
  list: (params?: any) => api.get('/crm/contacts', { params }),
  get: (id: string) => api.get(`/crm/contacts/${id}`),
  create: (data: any) => api.post('/crm/contacts', data),
  update: (id: string, data: any) => api.put(`/crm/contacts/${id}`, data),
  delete: (id: string) => api.delete(`/crm/contacts/${id}`),
};

export const leadsApi = {
  list: (params?: any) => api.get('/crm/leads', { params }),
  kanban: (params?: any) => api.get('/crm/leads', { params: { ...params, view: 'kanban' } }),
  summary: () => api.get('/crm/leads/pipeline-summary'),
  get: (id: string) => api.get(`/crm/leads/${id}`),
  create: (data: any) => api.post('/crm/leads', data),
  update: (id: string, data: any) => api.put(`/crm/leads/${id}`, data),
  moveStage: (id: string, data: any) => api.patch(`/crm/leads/${id}/stage`, data),
};

export const quotationsApi = {
  list: (params?: any) => api.get('/sales/quotations', { params }),
  get: (id: string) => api.get(`/sales/quotations/${id}`),
  create: (data: any) => api.post('/sales/quotations', data),
  update: (id: string, data: any) => api.put(`/sales/quotations/${id}`, data),
  send: (id: string) => api.patch(`/sales/quotations/${id}/send`),
  confirm: (id: string) => api.patch(`/sales/quotations/${id}/confirm`),
  cancel: (id: string) => api.patch(`/sales/quotations/${id}/cancel`),
};

export const ordersApi = {
  list: (params?: any) => api.get('/sales/orders', { params }),
  get: (id: string) => api.get(`/sales/orders/${id}`),
  done: (id: string) => api.patch(`/sales/orders/${id}/done`),
  cancel: (id: string) => api.patch(`/sales/orders/${id}/cancel`),
};

export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  addSerials: (id: string, data: any) => api.post(`/products/${id}/serials`, data),
  updateSerial: (id: string, serialId: string, data: any) => api.patch(`/products/${id}/serials/${serialId}`, data),
  import: (products: any[]) => api.post('/products/import', { products }),
};

export const amcApi = {
  list: (params?: any) => api.get('/amc', { params }),
  summary: () => api.get('/amc/summary'),
  get: (id: string) => api.get(`/amc/${id}`),
  create: (data: any) => api.post('/amc', data),
  update: (id: string, data: any) => api.put(`/amc/${id}`, data),
  renew: (id: string, data: any) => api.patch(`/amc/${id}/renew`, data),
  cancel: (id: string) => api.patch(`/amc/${id}/cancel`),
};