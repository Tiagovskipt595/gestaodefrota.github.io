import { User } from './types';
import api from './api';

const TOKEN_KEY = 'fleet-token';
const USER_KEY = 'fleet-user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

export async function register(userData: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  department?: string;
  licenseValidUntil?: string;
  role?: string;
}) {
  const response = await api.post('/auth/register', userData);
  if (response.data.token) {
    setToken(response.data.token);
    setUser(response.data.user);
  }
  return response.data;
}

export async function login(credentials: { email: string; password: string }) {
  const response = await api.post('/auth/login', credentials);
  if (response.data.token) {
    setToken(response.data.token);
    setUser(response.data.user);
  }
  return response.data;
}

export async function forgotPassword(email: string) {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (err: any) {
    return { message: 'Se o email existir, você receberá instruções para redefinir a senha' };
  }
}

export async function resetPassword(token: string, password: string) {
  const response = await api.post(`/auth/reset-password/${token}`, { password });
  return response.data;
}

