import axios from 'axios';
import { clearAuthSession, getStoredToken } from '@/lib/auth';

function resolveApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configured) {
    return 'http://localhost:3000/api/v1';
  }

  const normalized = configured.endsWith('/') ? configured.slice(0, -1) : configured;
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      clearAuthSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const message =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message ??
      'Request failed';

    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

export default api;
