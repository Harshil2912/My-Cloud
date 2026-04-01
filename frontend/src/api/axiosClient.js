import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,  // Send httpOnly refresh-token cookie
  timeout: 30_000,
});

// Attach CSRF token to every mutating request
api.interceptors.request.use(config => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
    const token = sessionStorage.getItem('csrf_token');
    if (token) {
      config.headers['x-csrf-token'] = token;
    }
  }
  return config;
});

// Auto-refresh access token on 401
let isRefreshing = false;
let failedQueue = [];

function shouldSkipAutoRefresh(requestUrl = '') {
  return requestUrl.includes('/auth/login')
    || requestUrl.includes('/auth/register')
    || requestUrl.includes('/auth/refresh')
    || requestUrl.includes('/csrf-token');
}

function processQueue(error, token = null) {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
}

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest?._retry && !shouldSkipAutoRefresh(originalRequest?.url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        const { accessToken } = res.data;
        localStorage.setItem('access_token', accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

// Set access token header from localStorage on page load
const stored = localStorage.getItem('access_token');
if (stored) api.defaults.headers.common['Authorization'] = `Bearer ${stored}`;

export default api;
