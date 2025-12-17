import axios from 'axios';
import { showToast } from '../utils/toast.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  }
);

const isNetworkError = (error) => {
  return (
    !error.response &&
    (error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error' ||
      error.message.includes('timeout'))
  );
};

const retryRequest = async (config, retryCount = 0) => {
  if (retryCount >= MAX_RETRIES) {
    throw new Error('Request failed after multiple retries');
  }

  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));

  try {
    const retryConfig = {
      ...config,
      baseURL: config.baseURL || API_BASE_URL,
      _retry: true,
    };
    return await axios(retryConfig);
  } catch (error) {
    if (isNetworkError(error) && retryCount < MAX_RETRIES - 1) {
      return retryRequest(config, retryCount + 1);
    }
    throw error;
  }
};

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    if (import.meta.env.DEV) {
      console.error(`[API Response Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      showToast.error('Session expired. Please login again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      const message = error.response?.data?.message || 'You do not have permission to perform this action';
      showToast.error(message);
      return Promise.reject(error);
    }

    if (isNetworkError(error)) {
      const config = error.config;
      if (config && !config._retry) {
        config._retry = true;
        try {
          return await retryRequest(config);
        } catch (retryError) {
          showToast.error('Network error. Please check your connection and try again.');
          return Promise.reject(retryError);
        }
      } else {
        showToast.error('Network error. Please check your connection and try again.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
