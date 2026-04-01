import api from './axiosClient';

export const sharesApi = {
  async create(fileId, recipientUsername, expiresAt = null) {
    return api.post('/shares', { fileId, recipientUsername, expiresAt });
  },

  async listMine() {
    return api.get('/shares/mine');
  },

  async listSharedWithMe() {
    return api.get('/shares/with-me');
  },

  async revoke(shareId) {
    return api.delete(`/shares/${shareId}`);
  },

  /**
   * Download a file that was shared with the current user.
   * @param {string} shareId
   * @param {function} onProgress - (percent: number) => void
   */
  async downloadShared(shareId, onProgress) {
    return api.get(`/shares/${shareId}/download`, {
      responseType: 'blob',
      onDownloadProgress: e => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      }
    });
  }
};
