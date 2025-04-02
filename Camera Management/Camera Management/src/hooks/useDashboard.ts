import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put, del } from '@/lib/axios';
import { ApiResponse, PaginatedResponse } from '@/lib/types';
import { toast } from 'sonner';

// Generic data fetching hook with pagination, sorting, and filtering
export function useDataFetching<T>(endpoint: string) {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10
  });
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});
  
  // Build query key with all parameters
  const queryKey = [endpoint, pagination.page, pagination.limit, sortBy, sortDirection, filters];
  
  // Use react-query for data fetching
  const {
    data: response,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      if (sortBy) {
        queryParams.append('sortBy', sortBy);
        queryParams.append('sortDirection', sortDirection);
      }
      
      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      // Make API call
      return await get<PaginatedResponse<T>>(`${endpoint}?${queryParams.toString()}`);
    }
  });
  
  // Reset pagination when filters change
  const handleFilterChange = (newFilters: Record<string, any>) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleFilterReset = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return {
    data: response?.data || [],
    pagination: {
      ...pagination,
      total: response?.total || 0,
      totalPages: response?.totalPages || 0
    },
    loading,
    error: error ? (error as Error).message : null,
    sortBy,
    sortDirection,
    filters,
    refetch,
    handlePageChange,
    handleLimitChange,
    handleSort,
    handleFilterChange,
    handleFilterReset
  };
}

// CRUD operations hook
export function useCrud<T, CreateDto = Partial<T>, UpdateDto = Partial<T>>(endpoint: string) {
  const queryClient = useQueryClient();
  const queryKey = [endpoint];
  
  // Fetch single item by ID
  const useGetById = (id: string | number) => {
    return useQuery({
      queryKey: [...queryKey, id],
      queryFn: async () => {
        const response = await get<ApiResponse<T>>(`${endpoint}/${id}`);
        return response.data;
      },
      enabled: !!id
    });
  };
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateDto) => {
      return await post<ApiResponse<T>>(endpoint, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Item created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create item');
    }
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: UpdateDto }) => {
      return await put<ApiResponse<T>>(`${endpoint}/${id}`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Item updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return await del<ApiResponse<void>>(`${endpoint}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  });
  
  return {
    useGetById,
    create: {
      mutate: createMutation.mutate,
      isLoading: createMutation.isPending,
      error: createMutation.error
    },
    update: {
      mutate: updateMutation.mutate,
      isLoading: updateMutation.isPending,
      error: updateMutation.error
    },
    remove: {
      mutate: deleteMutation.mutate,
      isLoading: deleteMutation.isPending,
      error: deleteMutation.error
    }
  };
}

// Analytics data hook for dashboards
export function useAnalytics(endpoint: string = '/analytics') {
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const queryKey = [endpoint, dateRange.start, dateRange.end];
  
  const {
    data: response,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', dateRange.start);
      queryParams.append('endDate', dateRange.end);
      
      const response = await get<ApiResponse<any>>(`${endpoint}?${queryParams.toString()}`);
      return response;
    }
  });

  const handleDateRangeChange = (newRange: { start: string; end: string }) => {
    setDateRange(newRange);
  };

  return {
    data: response?.data || null,
    loading,
    error: error ? (error as Error).message : null,
    dateRange,
    handleDateRangeChange,
    refetch
  };
} 