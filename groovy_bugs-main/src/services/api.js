import axios from 'axios';

// Use empty string for dev (Vite proxies /api to backend). Set VITE_API_BASE_URL for production.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clerk-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products API - paths use /api prefix for Vite proxy
export const productAPI = {
  getAll: async () => {
    const response = await api.get('/api/products');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  },

  getByCategory: async (category) => {
    const response = await api.get(`/api/products/category/${category}`);
    return response.data;
  },

  getFeatured: async () => {
    const response = await api.get('/api/products/featured');
    return response.data;
  },

  create: async (productData) => {
    const response = await api.post('/api/products', productData);
    return response.data;
  },

  update: async (id, productData) => {
    const response = await api.put(`/api/products/${id}`, productData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  }
};

// Cart API
export const cartAPI = {
  getCart: async (userId) => {
    const response = await api.get(`/api/cart/${userId}`);
    return response.data;
  },

  updateCart: async (userId, items) => {
    const response = await api.put(`/api/cart/${userId}`, { items });
    return response.data;
  },

  updateCartDetails: async (userId, detailsToUpdate) => {
    const response = await api.patch(`/api/cart/${userId}/details`, detailsToUpdate);
    return response.data;
  },

  addToCart: async (userId, productId, quantity = 1, options = {}) => {
    const response = await api.post(`/api/cart/${userId}/add`, {
      productId,
      quantity,
      options,
    });
    return response.data;
  },

  removeFromCart: async (userId, itemId) => {
    const response = await api.delete(`/api/cart/${userId}/remove/${itemId}`);
    return response.data;
  },

  clearCart: async (userId) => {
    const response = await api.delete(`/api/cart/${userId}/clear`);
    return response.data;
  }
};

// Orders API
export const orderAPI = {
  create: async (orderData) => {
    const response = await api.post('/api/orders', orderData);
    return response.data;
  },

  getByUserId: async (userId) => {
    const response = await api.get(`/api/orders/user/${userId}`);
    return response.data;
  },

  getById: async (orderId) => {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  },

  updateStatus: async (orderId, status) => {
    const response = await api.put(`/api/orders/${orderId}/status`, { status });
    return response.data;
  }
};

// Users API (no changes needed here)
export const userAPI = {
  getProfileDetails: async (clerkId) => {
    const response = await api.get(`/api/users/profile-details/${clerkId}`);
    return response.data;
  },
  create: async (userData) => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  getById: async (userId) => {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },

  update: async (userId, userData) => {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  delete: async (userId) => {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  },

  completeProfile: async (profileData) => {
    const response = await api.post('/api/users/profile-details', profileData);
    return response.data;
  }
};

export default api;
