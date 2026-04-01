import api from './axiosClient';

export const authApi = {
  // Fetch CSRF token before any auth mutation
  async getCsrfToken() {
    const res = await api.get('/csrf-token');
    sessionStorage.setItem('csrf_token', res.data.csrfToken);
    return res.data.csrfToken;
  },

  async register(username, email, password) {
    await authApi.getCsrfToken();
    return api.post('/auth/register', { username, email, password });
  },

  async login(identifier, password) {
    await authApi.getCsrfToken();
    return api.post('/auth/login', { identifier, password });
  },

  async logout() {
    const res = await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('csrf_token');
    delete api.defaults.headers.common['Authorization'];
    return res;
  },

  async me() {
    return api.get('/auth/me');
  },

  async getAvatar() {
    return api.get('/auth/avatar', { responseType: 'blob' });
  },

  async uploadAvatar(file) {
    await authApi.getCsrfToken();
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async deleteAccount() {
    await authApi.getCsrfToken();
    return api.delete('/auth/account');
  },

  async refresh() {
    return api.post('/auth/refresh');
  },

  async verifyEmail(token) {
    return api.get(`/auth/verify?token=${encodeURIComponent(token)}`);
  },

  async resendVerification() {
    await authApi.getCsrfToken();
    return api.post('/auth/resend-verification');
  }
};
