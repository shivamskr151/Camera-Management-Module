
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { post } from '@/lib/axios';
import { AuthState, LoginCredentials, RegisterCredentials, User, ApiResponse } from '@/lib/types';

// Define auth actions
type AuthAction =
  | { type: 'LOGIN_REQUEST' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'REGISTER_REQUEST' }
  | { type: 'REGISTER_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'RESTORE_AUTH' }
  | { type: 'CLEAR_ERROR' };

// Define auth context interface
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Initial auth state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
    case 'REGISTER_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null,
      };
    case 'RESTORE_AUTH':
      return {
        ...state,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Restore auth state on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // If we have a token, we could verify it with the server
      // For this template, we'll just set isAuthenticated to true
      dispatch({ type: 'RESTORE_AUTH' });
    } else {
      dispatch({ type: 'RESTORE_AUTH' });
    }
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_REQUEST' });
      
      // Call login API
      const response = await post<ApiResponse<{ user: User; token: string }>>(
        '/auth/login',
        credentials
      );
      
      const { user, token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Update auth state
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });
      
      // Show success message
      toast.success('Login successful');
      
      // Redirect to dashboard or home
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage,
      });
      
      toast.error(errorMessage);
    }
  };

  // Register function
  const register = async (credentials: RegisterCredentials) => {
    try {
      dispatch({ type: 'REGISTER_REQUEST' });
      
      // Call register API
      const response = await post<ApiResponse<{ user: User; token: string }>>(
        '/auth/register',
        credentials
      );
      
      const { user, token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Update auth state
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { user, token },
      });
      
      // Show success message
      toast.success('Registration successful');
      
      // Redirect to dashboard or home
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: errorMessage,
      });
      
      toast.error(errorMessage);
    }
  };

  // Logout function
  const logout = () => {
    // Clear token from localStorage
    localStorage.removeItem('token');
    
    // Update auth state
    dispatch({ type: 'LOGOUT' });
    
    // Show success message
    toast.success('Logged out successfully');
    
    // Redirect to login
    navigate('/login');
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        state,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
