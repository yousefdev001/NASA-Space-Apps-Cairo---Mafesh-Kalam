import { create } from 'zustand';
import { AuthState, User, UserRole } from '../types/auth.types';

export const useAuthStore = create<AuthState>((set, get) => {
  const initialToken = localStorage.getItem('auramed_token');
  const storedUser = localStorage.getItem('auramed_user');
  let initialUser: User | null = null;

  try {
    if (storedUser) {
      initialUser = JSON.parse(storedUser);
    }
  } catch {
    localStorage.removeItem('auramed_user');
  }

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken && !!initialUser,
    isLoading: false,

    setAuth: (user: User, token: string) => {
      localStorage.setItem('auramed_token', token);
      localStorage.setItem('auramed_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false });
    },

    logout: () => {
      localStorage.removeItem('auramed_token');
      localStorage.removeItem('auramed_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    },

    hasRole: (role: UserRole | UserRole[]) => {
      const { user } = get();
      if (!user) return false;
      if (Array.isArray(role)) {
        return role.some((r) => user.roles.includes(r));
      }
      return user.roles.includes(role);
    },

    hasPermission: (permission: string | string[]) => {
      const { user } = get();
      if (!user) return false;
      // system_administrator typically has all permissions
      if (user.roles.includes('system_administrator')) return true;
      if (Array.isArray(permission)) {
        return permission.some((p) => user.permissions.includes(p));
      }
      return user.permissions.includes(permission);
    },
  };
});
