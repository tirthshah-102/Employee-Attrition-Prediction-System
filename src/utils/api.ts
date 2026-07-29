import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token to all requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('attrisense_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration or unauthorized requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized request. Clearing tokens.');
      localStorage.removeItem('attrisense_token');
      localStorage.removeItem('attrisense_user');
      // Dispatch custom event to let the context know
      window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
