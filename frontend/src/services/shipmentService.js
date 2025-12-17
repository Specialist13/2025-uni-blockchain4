import api from './api.js';

export const shipmentService = {
  async getShipment(id) {
    const response = await api.get(`/shipments/${id}`);
    return response.data.data;
  },

  async getShipmentByOrderId(orderId) {
    const response = await api.get(`/shipments/order/${orderId}`);
    return response.data.data;
  },
};
