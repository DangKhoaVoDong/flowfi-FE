import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Backend API Gateway URL - adjust this based on your BE configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Token storage keys
const ACCESS_TOKEN_KEY = 'flowfi_access_token';
const REFRESH_TOKEN_KEY = 'flowfi_refresh_token';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const tokenService = {
  getAccessToken: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string): void => localStorage.setItem(ACCESS_TOKEN_KEY, token),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string): void => localStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getAccessToken();
    console.log('[API Request]', config.method?.toUpperCase(), config.url);
    console.log('[API Request] Token:', token ? `Bearer ${token.substring(0, 30)}...` : 'NULL');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request] Header set:', config.headers.Authorization.substring(0, 50) + '...');
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

// Custom event for logout (to work with React state, not full reload)
export const AUTH_LOGOUT_EVENT = 'flowfi-auth-logout';

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Response OK]', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    console.log('[API Response ERROR]', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    console.log('[API Response ERROR] Message:', error.message);

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[Auth] Got 401, attempting refresh...');
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenService.getRefreshToken();
        console.log('[Auth] Refresh token:', refreshToken ? 'EXISTS' : 'NULL');
        console.log('[Auth] Refresh token value:', refreshToken?.substring(0, 30) + '...');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshRequestBody = { refreshToken };
        console.log('[Auth] Refresh request body:', JSON.stringify(refreshRequestBody));
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, refreshRequestBody, {
          headers: { 'Content-Type': 'application/json' }
        });

        console.log('[Auth] Refresh response status:', response.status);
        console.log('[Auth] Refresh response data:', response.data);

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        tokenService.setAccessToken(accessToken);
        tokenService.setRefreshToken(newRefreshToken);

        processQueue(null, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('[Auth] Refresh failed:', refreshError);
        processQueue(refreshError as AxiosError, null);
        tokenService.clearTokens();
        window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { apiClient, API_BASE_URL };
