import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: 'https://fleet-management-backend-production-d000.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
