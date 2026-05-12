import { create } from 'zustand';

export interface UserInfo {
  name: string;
  email: string;
  avatar: string;
  employeeId?: string;
  openId?: string;
  unionId?: string;
}

export interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  useMockData: boolean;
  toggleMockData: () => void;
  sideNavCollapsed: boolean;
  toggleSideNav: () => void;
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => {
  const initTheme = (localStorage.getItem('app_theme') as 'light' | 'dark') || 'light';
  if (initTheme === 'dark') {
    document.body.setAttribute('theme-mode', 'dark');
  }

  return {
    theme: initTheme,
    setTheme: (theme) => {
      localStorage.setItem('app_theme', theme);
      if (theme === 'dark') {
        document.body.setAttribute('theme-mode', 'dark');
      } else {
        document.body.removeAttribute('theme-mode');
      }
      set({ theme });
    },
    toggleTheme: () => set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('app_theme', newTheme);
      if (newTheme === 'dark') {
        document.body.setAttribute('theme-mode', 'dark');
      } else {
        document.body.removeAttribute('theme-mode');
      }
      return { theme: newTheme };
    }),
    useMockData: true,
    toggleMockData: () => set((state) => ({ useMockData: !state.useMockData })),
  sideNavCollapsed: false,
  toggleSideNav: () => set((state) => ({ sideNavCollapsed: !state.sideNavCollapsed })),
  userInfo: {
    name: '测试用户',
    email: 'test_user@bytedance.com',
    avatar: '',
  },
  setUserInfo: (info) => set({ userInfo: info }),
  logout: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ userInfo: null });
      window.location.href = '/self_help/agent_call/login';
    },
  };
});
