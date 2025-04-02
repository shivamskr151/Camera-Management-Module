import { useMutation } from '@tanstack/react-query';
import { LoginCredentials, ApiResponse, User } from '@/lib/types';
import { toast } from 'sonner';
import store from '@/store';
import api from '@/lib/api';

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      store.getActions().auth.setIsLoading(true);
      try {
        const response = await api.post<{ 
          user: User; 
          token: string;
          refreshToken: string;
        }>('/login', credentials);
        
        return response.data;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Login failed';
        throw new Error(errorMessage);
      } finally {
        store.getActions().auth.setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      // Store tokens in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Update auth state in store
      store.getActions().auth.setUser(data.user);
      store.getActions().auth.setToken(data.token);
      store.getActions().auth.setIsAuthenticated(true);
      store.getActions().auth.setIsLoading(false);
      
      // Show success message
      toast.success('Login successful');
    },
    onError: (error: Error) => {
      // Clear auth state
      store.getActions().auth.setUser(null);
      store.getActions().auth.setToken(null);
      store.getActions().auth.setIsAuthenticated(false);
      store.getActions().auth.setIsLoading(false);
      
      toast.error(error.message);
    }
  });
}; 