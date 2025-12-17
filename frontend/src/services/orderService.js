import api from './api.js';

export const orderService = {
  async listOrders(options = {}) {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.status) params.append('status', options.status);

    const response = await api.get(`/orders?${params.toString()}`);
    return response.data.data;
  },

  async getOrder(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },

  async createOrder(productId) {
    const response = await api.post('/orders', { productId });
    return response.data.data;
  },

  async fundOrder(id, buyerPrivateKey = null) {
    const response = await api.post(`/orders/${id}/fund`, { buyerPrivateKey });
    return response.data.data;
  },

  async markReadyToShip(id, senderAddress, recipientAddress) {
    const response = await api.post(`/orders/${id}/ship`, {
      senderAddress,
      recipientAddress,
    });
    return response.data.data;
  },

  async confirmReceipt(id, buyerPrivateKey = null) {
    const response = await api.post(`/orders/${id}/confirm`, { buyerPrivateKey });
    return response.data.data;
  },
};
