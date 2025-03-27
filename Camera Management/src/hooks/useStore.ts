import { useStoreState } from 'easy-peasy';
import { StoreModel } from '@/store/model';
import { LoginCredentials, RegisterCredentials } from '@/lib/types';
import store from '@/store';

// Auth hooks
export const useAuth = () => {
  const auth = useStoreState((state: StoreModel) => state.auth);
  
  return {
    // State
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,
    
    // Actions
    login: (credentials: LoginCredentials) => {
      return store.getActions().auth.login(credentials) as Promise<boolean>;
    },
    register: (credentials: RegisterCredentials) => {
      return store.getActions().auth.register(credentials) as Promise<boolean>;
    },
    logout: () => {
      return store.getActions().auth.logout() as Promise<void>;
    },
    clearError: () => {
      return store.getActions().auth.setError(null);
    },
    restoreAuth: () => {
      return store.getActions().auth.restoreAuth() as Promise<void>;
    },
    
    // For compatibility with the existing code
    state: auth,
  };
};

// Theme hooks
export const useTheme = () => {
  const theme = useStoreState((state: StoreModel) => state.theme.theme);
  
  return {
    theme,
    setTheme: (newTheme: 'light' | 'dark') => {
      return store.getActions().theme.setTheme(newTheme);
    },
    toggleTheme: () => {
      return store.getActions().theme.toggleTheme() as Promise<void>;
    },
  };
};

// Auth check hooks
export const useAuthCheck = (redirectTo = '/login') => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
  };
};

// Role check hooks
export const useRole = (requiredRoles: string[], redirectTo = '/not-authorized') => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const hasAccess = user && requiredRoles.includes(user.role);
  
  return {
    hasAccess: hasAccess || false,
    isLoading,
  };
};
