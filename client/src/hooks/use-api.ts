import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { authService } from "../lib/auth";

const API_BASE = "/api";

export const useAuthenticatedFetch = () => {
  const queryClient = useQueryClient();

  const authenticatedFetch = async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = authService.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
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

export function useAuthenticatedQuery<T>(
  key: any[],
  url: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          authService.logout();
          window.location.href = '/login';
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    ...options,
  });
}

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