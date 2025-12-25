// Jaan Distributors - Authentication State Management
// Token-based authentication designed for Odoo res.users / res.partner

import type { User } from './types';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getAccount } from './api';

const AUTH_TOKEN_KEY = 'jaan_auth_token';
const AUTH_USER_KEY = 'jaan_auth_user';

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading user from storage:', error);
  }
  
  return null;
}

/**
 * Save auth data to localStorage
 */
function saveAuthData(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth data from localStorage
 */
function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await apiLogin(email, password);
  
  if (response.success && response.user && response.token) {
    saveAuthData(response.token, response.user);
    return { success: true, user: response.user };
  }
  
  return { success: false, error: response.error || 'Login failed' };
}

/**
 * Register new user
 */
export async function register(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await apiRegister(data);
  
  if (response.success && response.user && response.token) {
    saveAuthData(response.token, response.user);
    return { success: true, user: response.user };
  }
  
  return { success: false, error: response.error || 'Registration failed' };
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  await apiLogout();
  clearAuthData();
}

/**
 * Refresh user data from server
 */
export async function refreshUser(): Promise<User | null> {
  if (!isAuthenticated()) return null;
  
  const response = await getAccount();
  
  if (response.success && response.data) {
    const token = getAuthToken();
    if (token) {
      saveAuthData(token, response.data);
    }
    return response.data;
  }
  
  // Token might be invalid, clear auth data
  clearAuthData();
  return null;
}
