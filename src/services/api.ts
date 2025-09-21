import axios from 'axios';
import type { AxiosRequestHeaders } from 'axios';

const api = axios.create({
  baseURL:  import.meta.env.VITE_API_BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

// Helper function to get CSRF token from cookie
const getCsrfTokenFromCookie = (): string | null => {
  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  return null;
};

// Track if we've already fetched CSRF token
let csrfTokenFetched = false;

// Request interceptor for CSRF token
api.interceptors.request.use(
  async (config) => {
    // Attach Authorization token if available
    const token = localStorage.getItem('auth-token') || localStorage.getItem('auth_token');
    if (token && !config.headers?.Authorization) {
      config.headers = (config.headers || {}) as AxiosRequestHeaders;
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Only fetch CSRF token once and for state-changing methods
    const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(
      config.method?.toLowerCase() || ''
    );
    
    if (needsCsrf && !csrfTokenFetched) {
      try {
        // Use the same api instance to get CSRF cookie
        await api.get('/sanctum/csrf-cookie');
        csrfTokenFetched = true;
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    }

    // Get CSRF token from cookie and add to headers
    if (needsCsrf) {
      const csrfToken = getCsrfTokenFromCookie();
      if (csrfToken) {
        (config.headers as AxiosRequestHeaders)['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Reset CSRF token flag on 419 (CSRF token mismatch)
    if (error.response?.status === 419) {
      csrfTokenFetched = false;
    }
    
    if (error.response?.status === 401) {
      // Clear any stored auth data
      localStorage.removeItem('auth_token');
      // Redirect to login if unauthorized
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;