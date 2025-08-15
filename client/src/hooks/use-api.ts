
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../lib/auth";

const API_BASE = "/api";

export const useAuthenticatedFetch = () => {
  const queryClient = useQueryClient();

  const authenticatedFetch = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = authService.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      authService.logout();
      queryClient.clear();
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }

    return response;
  };

  return authenticatedFetch;
};

export const useAuthenticatedQuery = <T>(
  key: string | string[],
  endpoint: string,
  options?: any
) => {
  const fetch = useAuthenticatedFetch();
  
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    ...options,
  });
};

export const useAuthenticatedMutation = <T, V = unknown>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: any
) => {
  const fetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation<T, Error, V>({
    mutationFn: async (data: V) => {
      const response = await fetch(endpoint, {
        method,
        body: data ? JSON.stringify(data) : undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries after mutation
      queryClient.invalidateQueries();
    },
    ...options,
  });
};
