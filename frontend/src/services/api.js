import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || 'Something went wrong. Please try again.';
    if (err.response?.status === 401) {
      const isAuthCall = err.config?.url?.includes('/auth/');
      if (!isAuthCall) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    err.userMessage = message;
    return Promise.reject(err);
  }
);

export const isImageUrl = (src) => /^(https?:)?\/\//.test(src || '');

export const resolveImage = (src, fallback = 'https://picsum.photos/seed/shopsphere/600/400') => {
  if (!src) return fallback;
  if (isImageUrl(src)) return src;
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  return `${base}${src}`;
};

export default api;
