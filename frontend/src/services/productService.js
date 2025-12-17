import api from './api.js';

export const productService = {
  async listProducts(options = {}) {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);
    if (options.seller) params.append('seller', options.seller);
    if (options.isActive !== undefined) params.append('isActive', options.isActive);
    if (options.minPrice) params.append('minPrice', options.minPrice);
    if (options.maxPrice) params.append('maxPrice', options.maxPrice);
    if (options.search) params.append('search', options.search);

    const response = await api.get(`/products?${params.toString()}`);
    return response.data.data;
  },

  async getProduct(id) {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },

  async createProduct(productData) {
    const response = await api.post('/products', productData);
    return response.data.data;
  },

  async updateProduct(id, productData) {
    const response = await api.put(`/products/${id}`, productData);
    return response.data.data;
  },

  async deactivateProduct(id) {
    const response = await api.delete(`/products/${id}`);
    return response.data.data;
  },
};
