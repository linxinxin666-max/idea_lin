import axios from 'axios';
import { useAppStore } from '../stores/useAppStore';
import { useAuthStore } from '../stores/useAuthStore';
import { BACKEND_AUTHORIZATION } from '../utils/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const { useMockData } = useAppStore.getState();
  if (useMockData) {
    config.baseURL = '/mock-api';
  } else {
    config.baseURL = API_BASE_URL;
  }
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers.Authorization = BACKEND_AUTHORIZATION;
  return config;
});

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default request;
