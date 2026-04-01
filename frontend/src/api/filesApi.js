import api from './axiosClient';

export const filesApi = {
  /**
   * Upload a file with progress callback.
   * Refreshes the CSRF token first so the __Host-csrf cookie + x-csrf-token header
   * are always in sync (required by doubleCsrfProtection on the upload route).
   * @param {File} file
   * @param {function} onProgress - (percent: number) => void
   */
  async upload(file, onProgress) {
    // Always get a fresh CSRF token before upload — this sets the __Host-csrf cookie
    // and stores the token in sessionStorage so the axios interceptor can attach it.
    const csrfRes = await api.get('/csrf-token');
    sessionStorage.setItem('csrf_token', csrfRes.data.csrfToken);

    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,    // No timeout for uploads — large files can take a while
      onUploadProgress: e => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      }
    });
  },

  /**
   * List files with optional pagination.
   * @param {object} params - { page, limit, search }
   */
  async list(params = {}) {
    return api.get('/files', { params });
  },

  async metadata(fileId) {
    return api.get(`/files/${fileId}/metadata`);
  },

  /**
   * Download a file (returns blob).
   * Backend supports HTTP Range — axios handles resumable downloads automatically.
   * @param {string} fileId
   * @param {function} onProgress - (percent: number) => void
   */
  async download(fileId, onProgress) {
    return api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
      onDownloadProgress: e => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      }
    });
  },

  async preview(fileId) {
    return api.get(`/files/${fileId}/preview`, {
      responseType: 'blob',
    });
  },

  async deleteFile(fileId) {
    return api.delete(`/files/${fileId}`);
  }
};
