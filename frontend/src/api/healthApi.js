import api from './axiosClient';

export const healthApi = {
  async getHealth() {
    return api.get('/health');
  }
};
