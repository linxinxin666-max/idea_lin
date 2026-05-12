import { create } from 'zustand';

export interface User {
  name: string;
  email: string;
  avatar: string;
  employeeId: string;
  openId: string;
  unionId: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const getStoredToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  user: getStoredUser(),
  isAuthenticated: (() => {
    const token = getStoredToken();
    if (!token) return false;
    if (isTokenExpired(token)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return false;
    }
    return true;
  })(),

  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null, isAuthenticated: false });
    window.location.href = '/self_help/agent_call/login';
  },

  checkAuth: () => {
    const { token } = get();
    if (!token) return false;
    if (isTokenExpired(token)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return false;
    }
    return true;
  },
}));
