import axios from 'axios';

// Use empty string for dev (Vite proxies /api to backend). Set VITE_API_BASE_URL for production.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Bug 10 fix: Dynamic token injection pattern.
 *
 * Previously, the interceptor read `clerk-token` from localStorage which is a stale
 * snapshot — Clerk tokens expire (~1 hour) and the copy in localStorage goes stale.
 * This caused silent 401 errors on all authenticated API calls after ~1 hour.
 *
 * Fix: CartContext/ClerkSync call `setTokenGetter(getToken)` to register Clerk's
 * `getToken` function here. The interceptor then calls it on every request, always
 * getting a fresh, valid JWT.
 */
let _getToken = null;

export const setTokenGetter = (fn) => {
  _getToken = fn;
};

// Add auth token to every request — always fresh via Clerk's getToken()
api.interceptors.request.use(async (config) => {
  try {
    if (_getToken) {
      const token = await _getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    // If token fetch fails, proceed without auth header (public routes still work)
    console.warn('[api] Could not retrieve auth token:', err.message);
  }
  return config;
});

// Response interceptor: normalise 401 errors for easy handling across the app
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[api] 401 Unauthorized — token may be expired or missing.');
    }
    return Promise.reject(error);
  }
);

// Products API
export const productAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/products', { params });
    return response.data;
  },

  getAllAdmin: async () => {
    const response = await api.get('/api/products/admin/all');
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
  },

  // Admin: toggle inStock without code changes
  toggleStock: async (id) => {
    const response = await api.patch(`/api/products/${id}/stock`);
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

  addToCart: async (userId, productId, quantity = 1, size, customization) => {
    const response = await api.post(`/api/cart/${userId}/add`, {
      productId,
      quantity,
      size,
      customization,
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

  // UX 1: Creates a pending WhatsApp order + returns orderNumber
  createWhatsApp: async (orderData) => {
    const response = await api.post('/api/orders/whatsapp', orderData);
    return response.data;
  },

  getByUserId: async (userId, params = {}) => {
    const response = await api.get(`/api/orders/user/${userId}`, { params });
    return response.data;
  },

  getById: async (orderId) => {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  },

  updateStatus: async (orderId, status, note) => {
    const response = await api.put(`/api/orders/${orderId}/status`, { status, note });
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/api/orders', { params });
    return response.data;
  }
};

// Users API
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

  getByClerkId: async (clerkId) => {
    const response = await api.get(`/api/users/clerk/${clerkId}`);
    return response.data;
  },

  update: async (userId, userData) => {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  completeProfile: async (profileData) => {
    const response = await api.post('/api/users/profile-details', profileData);
    return response.data;
  }
};

export default api;
