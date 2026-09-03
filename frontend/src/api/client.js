import axios from 'axios';
import { getAccessToken } from './authTokens';
import { createTokenRefresher } from './createTokenRefresher';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

const { handleUnauthorizedError } = createTokenRefresher({
  axios,
  apiBase: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => handleUnauthorizedError(error, api),
);

export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  loginSendOtp: (data) => api.post('/auth/login/send-otp/', data),
  loginVerifyOtp: (data) => api.post('/auth/login/verify-otp/', data),
  register: (data) => api.post('/auth/register/', data),
  sendEmailOtp: (email) => api.post('/auth/email/send-otp/', { email }),
  verifyEmailOtp: (data) => api.post('/auth/email/verify-otp/', data),
  googleAuth: (data) => api.post('/auth/google/', data),
  firebaseAuth: (data) => api.post('/auth/firebase/', data),
  firebaseRegister: (data) => api.post('/auth/firebase/register/', data),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  forgotPasswordSendOtp: (email) => api.post('/auth/forgot-password/send-otp/', { email }),
  forgotPasswordVerifyOtp: (data) => api.post('/auth/forgot-password/verify-otp/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  passwordChange: (data) => api.post('/auth/password-change/', data),
  lookupPincode: (pincode) => api.get(`/auth/pincode/${pincode}/`),
};

export const servicesAPI = {
  categories: () => api.get('/services/categories/'),
  guides: (params) => api.get('/services/guides/', { params }),
  guide: (slug) => api.get(`/services/guides/${slug}/`),
  priceRanges: (params) => api.get('/services/price-ranges/', { params }),
  fairPriceCheck: (data) => api.post('/services/fair-price/check/', data),
};

export const providersAPI = {
  list: (params) => api.get('/providers/', { params }),
  detail: (id) => api.get(`/providers/${id}/`),
  partners: (params) => api.get('/providers/partners/', { params }),
  partner: (id) => api.get(`/providers/partners/${id}/`),
  recommendations: (params) => api.get('/providers/recommendations/', { params }),
  profile: () => api.get('/providers/profile/'),
  partnerProfile: () => api.get('/providers/partners/profile/'),
  partnerDashboard: () => api.get('/providers/partners/dashboard/'),
  technicians: () => api.get('/providers/partners/technicians/'),
  createTechnician: (data) => api.post('/providers/partners/technicians/', data),
  warrantyClaims: () => api.get('/providers/partners/warranty-claims/'),
  quotations: () => api.get('/providers/partners/quotations/'),
  spareParts: () => api.get('/providers/partners/spare-parts/'),
};

export const aiAPI = {
  analyze: (formData) => api.post('/ai/analyze/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  list: () => api.get('/ai/'),
  detail: (id) => api.get(`/ai/${id}/`),
  savePassport: (id) => api.post(`/ai/${id}/save-passport/`),
};

export const bookingsAPI = {
  list: (params) => api.get('/bookings/', { params }),
  create: (data) => api.post('/bookings/', data),
  detail: (id) => api.get(`/bookings/${id}/`),
  update: (id, data) => api.patch(`/bookings/${id}/`, data),
  action: (id, action, data) => api.post(`/bookings/${id}/${action}/`, data),
  availableSlots: (id, params) => api.get(`/bookings/${id}/available-slots/`, { params }),
  holdSlot: (id, data) => api.post(`/bookings/${id}/hold-slot/`, data),
  confirmSlot: (id, data) => api.post(`/bookings/${id}/confirm-slot/`, data),
  releaseSlot: (id) => api.post(`/bookings/${id}/release-slot/`),
  invoice: (id) => api.get(`/bookings/${id}/invoice/`),
  review: (id, data) => api.post(`/bookings/${id}/review/`, data),
};

export const trackingAPI = {
  start: (id) => api.post(`/tracking/${id}/start/`),
  update: (id, data) => api.post(`/tracking/${id}/update/`, data),
  status: (id) => api.get(`/tracking/${id}/status/`),
  stop: (id) => api.post(`/tracking/${id}/stop/`),
};

export const passportAPI = {
  assets: () => api.get('/passport/assets/'),
  createAsset: (data) => api.post('/passport/assets/', data),
  updateAsset: (id, data) => api.patch(`/passport/assets/${id}/`, data),
  deleteAsset: (id) => api.delete(`/passport/assets/${id}/`),
};

export const supportAPI = {
  tickets: () => api.get('/support/tickets/'),
  createTicket: (data) => api.post('/support/tickets/', data),
  ticket: (id) => api.get(`/support/tickets/${id}/`),
  updateTicket: (id, data) => api.patch(`/support/tickets/${id}/`, data),
  message: (id, data) => api.post(`/support/tickets/${id}/messages/`, data),
  chat: (data) => api.post('/support/chat/', data),
  faq: (q) => api.get('/support/faq/', { params: { q } }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
};

export const calendarAPI = {
  customer: () => api.get('/calendar/customer/'),
  provider: () => api.get('/calendar/provider/'),
  partner: () => api.get('/calendar/partner/'),
  admin: () => api.get('/calendar/admin/'),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard/'),
  users: (role) => api.get('/admin/users/', { params: role ? { role } : {} }),
  bookings: () => api.get('/admin/bookings/'),
  tickets: () => api.get('/admin/tickets/'),
};

export default api;
