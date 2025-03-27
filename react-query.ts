import { QueryClient, QueryClientConfig, useQuery } from '@tanstack/react-query';

// Custom error handler for fetch
const onError = (error: unknown) => {
  if (error instanceof Error) {
    console.error('Fetch Error:', error.message);
    // TODO: Trigger global notification
  } else {
    console.error('Unknown error:', error);
  }
};

// Custom fetch function with timeout
const fetchWithTimeout = async (input: RequestInfo, init?: RequestInit, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal
    });
    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
};

const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute
      gcTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
      refetchOnMount: true,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      throwOnError(error, query) {
          onError(error)
      },
    },
    mutations: {
      retry: 2,
      onError,
    },
  },
};

const queryClient = new QueryClient(queryClientConfig);

// Utility function to invalidate queries by prefix
export const invalidateQueriesByPrefix = async (prefix: string) => {
  await queryClient.invalidateQueries({ queryKey: [prefix] });
};

// Utility function to prefetch user data
export const prefetchUserData = async (userId: string) => {
  await queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchWithTimeout(`/api/users/${userId}`),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Utility function to update cached data
export const updateCachedData = <T>(queryKey: string[], updater: (oldData: T) => T) => {
  queryClient.setQueryData<T>(queryKey, oldData => {
    if (oldData) {
      return updater(oldData);
    }
    return oldData;
  });
};

export const useQueryWithTimeout = <T>(url: string, options?: RequestInit) => {
  return useQuery<T, Error>({
    queryKey: [url],
    queryFn: () => fetchWithTimeout(url, options),
  });
};

export default queryClient;
