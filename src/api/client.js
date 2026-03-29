import axios from 'axios';

const api = axios.create({
  baseURL: 'https://food-order.cyclescentre.com/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Add interceptor for auth token if needed
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const productApi = {
  getAll: () => api.get('/categories/all/products'), // Adjusting based on common patterns
  getCategories: () => api.get('/categories'),
  getProductsByCategory: (category) => api.get(`/categories/${category}/products`),
};

export const orderApi = {
  getAll: () => api.get('/orders'), // Might need verification of endpoint
  updateStatus: (id, status) => api.patch(`/orders/${id}`, { status }),
};

export default api;
