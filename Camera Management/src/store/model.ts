import { Action, Computed, Thunk, action, computed, thunk } from 'easy-peasy';
import { User, LoginCredentials, RegisterCredentials, ApiResponse, CameraConfig } from '@/lib/types';
import { post } from '@/lib/axios';
import { toast } from 'sonner';
import { ActivityConfig } from './activities';

// Activity Model
export interface ActivityModel {
  // State
  activities: ActivityConfig[];
  
  // Actions
  addActivity: Action<ActivityModel, ActivityConfig>;
  updateActivity: Action<ActivityModel, ActivityConfig>;
  deleteActivity: Action<ActivityModel, string>;
  getActivityNames: Action<ActivityModel, string[]>;
}

// Camera Config Model
export interface CameraConfigModel {
  // State
  configs: CameraConfig[];
  
  // Actions
  addConfig: Action<CameraConfigModel, CameraConfig>;
  updateConfig: Action<CameraConfigModel, CameraConfig>;
  removeConfig: Action<CameraConfigModel, string>;
}

// Auth Model
export interface AuthModel {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: Action<AuthModel, User | null>;
  setToken: Action<AuthModel, string | null>;
  setIsAuthenticated: Action<AuthModel, boolean>;
  setIsLoading: Action<AuthModel, boolean>;
  setError: Action<AuthModel, string | null>;
  
  // Computed
  hasRole: Computed<AuthModel, (role: string) => boolean>;
  
  // Thunks
  login: Thunk<AuthModel, LoginCredentials>;
  register: Thunk<AuthModel, RegisterCredentials>;
  logout: Thunk<AuthModel>;
  restoreAuth: Thunk<AuthModel>;
}

// Theme Model
export interface ThemeModel {
  // State
  theme: 'light' | 'dark';
  
  // Actions
  setTheme: Action<ThemeModel, 'light' | 'dark'>;
  
  // Thunks
  toggleTheme: Thunk<ThemeModel>;
  initTheme: Thunk<ThemeModel>;
}

// Root Store Model
export interface StoreModel {
  auth: AuthModel;
  theme: ThemeModel;
  cameraConfig: CameraConfigModel;
  activity: ActivityModel;
}

// Camera Config Model Implementation
export const cameraConfigModel: CameraConfigModel = {
  // State
  configs: [],
  
  // Actions
  addConfig: action((state, payload) => {
    const existingIndex = state.configs.findIndex(config => config.id === payload.id);
    if (existingIndex >= 0) {
      state.configs[existingIndex] = payload;
    } else {
      state.configs.push(payload);
    }
  }),
  
  updateConfig: action((state, payload) => {
    const index = state.configs.findIndex(config => config.id === payload.id);
    if (index >= 0) {
      state.configs[index] = payload;
    }
  }),
  
  removeConfig: action((state, payload) => {
    state.configs = state.configs.filter(config => config.id !== payload);
  })
};

// Auth Model Implementation
export const authModel: AuthModel = {
  // State
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  // Actions
  setUser: action((state, payload) => {
    state.user = payload;
  }),
  setToken: action((state, payload) => {
    state.token = payload;
    if (payload) {
      localStorage.setItem('token', payload);
    } else {
      localStorage.removeItem('token');
    }
  }),
  setIsAuthenticated: action((state, payload) => {
    state.isAuthenticated = payload;
  }),
  setIsLoading: action((state, payload) => {
    state.isLoading = payload;
  }),
  setError: action((state, payload) => {
    state.error = payload;
  }),
  
  // Computed
  hasRole: computed((state) => (role: string) => {
    return state.user?.role === role;
  }),
  
  // Thunks
  login: thunk(async (actions, credentials) => {
    try {
      actions.setError(null);
      
      // Call login API
      const response = await post<ApiResponse<{ 
        user: User; 
        token: string;
        refreshToken: string;
      }>>(
        '/auth/login',
        credentials
      );
      
      const { user, token, refreshToken } = response.data;
      
      // Update auth state
      actions.setUser(user);
      actions.setToken(token);
      actions.setIsAuthenticated(true);
      
      // Store refresh token in localStorage
      localStorage.setItem('refreshToken', refreshToken);
      
      // Show success message
      toast.success('Login successful');
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      actions.setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }),
  
  register: thunk(async (actions, credentials) => {
    try {
      actions.setIsLoading(true);
      actions.setError(null);
      
      // Call register API
      const response = await post<ApiResponse<{ 
        user: User; 
        token: string;
        refreshToken: string;
      }>>(
        '/auth/register',
        credentials
      );
      
      const { user, token, refreshToken } = response.data;
      
      // Update auth state
      actions.setUser(user);
      actions.setToken(token);
      actions.setIsAuthenticated(true);
      
      // Store refresh token
      localStorage.setItem('refreshToken', refreshToken);
      
      // Show success message
      toast.success('Registration successful');
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      actions.setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      actions.setIsLoading(false);
    }
  }),
  
  logout: thunk(async (actions) => {
    // Clear tokens and user data
    actions.setToken(null);
    actions.setUser(null);
    actions.setIsAuthenticated(false);
    actions.setError(null);
    
    localStorage.removeItem('refreshToken');
    
    // Show success message
    toast.success('Logged out successfully');
  }),
  
  restoreAuth: thunk(async (actions) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        actions.setIsAuthenticated(false);
        actions.setIsLoading(false);
        return;
      }

      // Set the token in the store
      actions.setToken(token);

      // Verify token with the server
      const response = await post<ApiResponse<{ user: User }>>(
        '/auth/verify-token'
      );
      
      // If we get here, token is valid
      actions.setUser(response.data.user);
      actions.setIsAuthenticated(true);
    } catch (error) {
      // Token is invalid, clear it
      actions.setToken(null);
      actions.setUser(null);
      actions.setIsAuthenticated(false);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      actions.setIsLoading(false);
    }
  })
};

// Theme Model Implementation
export const themeModel: ThemeModel = {
  // State
  theme: 'light',
  
  // Actions
  setTheme: action((state, payload) => {
    state.theme = payload;
    
    // Apply theme to document element
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(payload);
    
    // Save theme to localStorage
    localStorage.setItem('theme', payload);
  }),
  
  // Thunks
  toggleTheme: thunk((actions, _, { getState }) => {
    const currentTheme = getState().theme;
    actions.setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }),
  
  initTheme: thunk((actions) => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      actions.setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      actions.setTheme('dark');
    }
  })
};

// Activity Model Implementation
export const activityModel: ActivityModel = {
  // State
  activities: [],
  
  // Actions
  addActivity: action((state, activity) => {
    state.activities.push(activity);
  }),
  
  updateActivity: action((state, activity) => {
    const index = state.activities.findIndex(a => a.id === activity.id);
    if (index !== -1) {
      state.activities[index] = activity;
    }
  }),
  
  deleteActivity: action((state, id) => {
    state.activities = state.activities.filter(a => a.id !== id);
  }),
  
  getActivityNames: action((state) => {
    return state.activities.map(activity => activity.name);
  })
};
