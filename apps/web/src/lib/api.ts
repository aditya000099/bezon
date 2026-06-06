import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true, // Enables cookies to be sent with requests
});

// Response interceptor to handle authentication failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Do not redirect if the request was just checking auth state or fetching background data
      const url = error.config?.url || '';
      if (url.includes('auth/me') || url.includes('notifications')) {
        return Promise.reject(error);
      }

      // Clear local state and redirect to login if session expires
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
