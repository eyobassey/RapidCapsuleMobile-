import axios from 'axios';
import {storage} from '../utils/storage';

const API_BASE_URL = 'https://api.rapidcapsule.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(async config => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await storage.clear();
    }
    return Promise.reject(error);
  },
);

export default api;
