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

  async listAvailableShipments() {
    const response = await api.get('/shipments/courier/available');
    return response.data.data;
  },

  async listCourierShipments(options = {}) {
    const params = new URLSearchParams();
    if (options.status) params.append('status', options.status);
    if (options.activeOnly) params.append('activeOnly', 'true');
    
    const response = await api.get(`/shipments/courier/assigned?${params.toString()}`);
    return response.data.data;
  },

  async getCourierDashboard() {
    const response = await api.get('/shipments/courier/dashboard');
    return response.data.data;
  },

  async confirmPickup(id) {
    const response = await api.post(`/shipments/${id}/pickup`);
    return response.data.data;
  },

  async confirmDelivery(id) {
    const response = await api.post(`/shipments/${id}/delivery`);
    return response.data.data;
  },
};
