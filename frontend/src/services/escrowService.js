import api from './api.js';

export const escrowService = {
  async getEscrow(id) {
    const response = await api.get(`/escrows/${id}`);
    return response.data.data;
  },
};
