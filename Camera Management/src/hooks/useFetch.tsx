import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/axios';
import { toast } from 'sonner';
import { ApiResponse, PaginatedResponse } from '@/lib/types';

// Hook for fetching data
export function useFetch<T>(
  queryKey: string | string[],
  url: string, 
  options = {}
) {
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  return useQuery({
    queryKey: queryKeyArray,
    queryFn: async () => {
      try {
        return await get<ApiResponse<T>>(url);
      } catch (error) {
        console.error('Fetch error:', error);
        throw error;
      }
    },
    ...options
  });
}

// Hook for fetching paginated data
export function usePaginatedFetch<T>(
  queryKey: string | string[],
  url: string,
  page = 1,
  limit = 10,
  options = {}
) {
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  const finalUrl = `${url}?page=${page}&limit=${limit}`;
  
  return useQuery({
    queryKey: [...queryKeyArray, page, limit],
    queryFn: async () => {
      try {
        return await get<PaginatedResponse<T>>(finalUrl);
      } catch (error) {
        console.error('Paginated fetch error:', error);
        throw error;
      }
    },
    ...options
  });
}

// Hook for creating data
export function useCreate<T, D>(url: string, options = {}) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: D) => {
      try {
        return await post<ApiResponse<T>, D>(url, data);
      } catch (error) {
        console.error('Create error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Successfully created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create');
    },
    ...options
  });
}

// Hook for updating data
export function useUpdate<T, D>(url: string, queryKey: string | string[], options = {}) {
  const queryClient = useQueryClient();
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: D }) => {
      try {
        return await put<ApiResponse<T>, D>(`${url}/${id}`, data);
      } catch (error) {
        console.error('Update error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
      toast.success(data.message || 'Successfully updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update');
    },
    ...options
  });
}

// Hook for deleting data
export function useDelete<T>(url: string, queryKey: string | string[], options = {}) {
  const queryClient = useQueryClient();
  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        return await del<ApiResponse<T>>(`${url}/${id}`);
      } catch (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeyArray });
      toast.success(data.message || 'Successfully deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update');
    },
    ...options
  });
}
