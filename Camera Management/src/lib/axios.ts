import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { toast } from 'sonner';
import store from '@/store';

// Get the base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing the token
let isRefreshing = false;
// Store pending requests that should be retried after token refresh
let failedQueue: { resolve: Function; reject: Function }[] = [];

// Track token initialization state
let isTokenInitialized = false;
// Queue for requests made before token is initialized
let tokenInitQueue: { config: any; resolve: Function; reject: Function }[] = [];

// Function to process queued requests
const processQueue = (error: any = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  
  failedQueue = [];
};

// Function to process token initialization queue
const processTokenInitQueue = () => {
  tokenInitQueue.forEach(request => {
    axiosClient(request.config)
      .then(response => request.resolve(response))
      .catch(error => request.reject(error));
  });
  
  tokenInitQueue = [];
};

// Function to set token initialization status
export const setTokenInitialized = (status: boolean) => {
  isTokenInitialized = status;
  if (status) {
    processTokenInitQueue();
  }
};

// Add a request interceptor
axiosClient.interceptors.request.use(
  async (config) => {
    // If token is not initialized and this is a secured endpoint (not login/register)
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                           config.url?.includes('/auth/register') ||
                           config.url?.includes('/auth/refresh-token');
    
    if (!isTokenInitialized && !isAuthEndpoint) {
      // Return a promise that will be resolved when token is initialized
      return new Promise((resolve, reject) => {
        tokenInitQueue.push({ 
          config, 
          resolve: (response: any) => resolve(response),
          reject: (error: any) => reject(error)
        });
      });
    }
    
    // Get token from local storage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const { response } = error;
    
    // Handle token refresh for 401 errors (but not for the refresh token endpoint itself)
    if (response?.status === 401 && !originalRequest._retry && 
        originalRequest.url !== '/auth/refresh-token') {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(originalRequest))
          .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Get refresh token from localStorage
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Call refresh token API
        const response = await axiosClient.post('/auth/refresh-token', {
          refreshToken
        });
        
        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        // Update tokens in store
        store.getActions().auth.setToken(token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update authorization header for original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Process queued requests
        processQueue();
        
        // Retry the original request
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, process queue with error
        processQueue(refreshError);
        
        // Force logout
        store.getActions().auth.logout();
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    if (response) {
      const status = response.status;
      
      // Handle 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        localStorage.removeItem('token');
        // Dispatch logout action if using Redux/Context
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
          toast.error('Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
      }
      
      // Handle 403 Forbidden - Not enough permissions
      if (status === 403) {
        toast.error('You do not have permission to perform this action');
        
        // Optionally redirect to a "not authorized" page
        if (window.location.pathname !== '/not-authorized') {
          window.location.href = '/not-authorized';
        }
      }
      
      // Handle 404 Not Found
      if (status === 404) {
        toast.error('The requested resource was not found');
      }
      
      // Handle 500 Internal Server Error
      if (status >= 500) {
        toast.error('An unexpected error occurred. Please try again later');
      }
    } else {
      // Network error
      toast.error('Unable to connect to the server. Please check your internet connection');
    }
    
    return Promise.reject(error);
  }
);

// Generic get function with typing
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.get<T>(url, config);
  return response.data;
};

// Generic post function with typing
export const post = async <T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.post<T>(url, data, config);
  return response.data;
};

// Generic put function with typing
export const put = async <T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.put<T>(url, data, config);
  return response.data;
};

// Generic patch function with typing
export const patch = async <T, D = any>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.patch<T>(url, data, config);
  return response.data;
};

// Generic delete function with typing
export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await axiosClient.delete<T>(url, config);
  return response.data;
};

export default axiosClient;
