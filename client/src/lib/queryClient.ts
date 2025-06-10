import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Global flag to prevent error messages during initial load
let isInitialLoad = true;
setTimeout(() => { isInitialLoad = false; }, 3000); // After 3 seconds, consider initial load complete

// Safely check if the app is trying to make requests while not authenticated
const isAuthRelatedRequest = (url: string) => {
  return url.includes('/api/auth/') || url === '/api/login';
};

async function throwIfResNotOk(res: Response) {
  // Don't throw on auth errors, they'll be handled specially
  if (!res.ok && res.status !== 401) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (data) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      cache: "no-cache",
    });

    // Handle 401 error specially
    if (res.status === 401) {
      if (!isInitialLoad && !isAuthRelatedRequest(url)) {
        console.log(`Auth required for ${url}`);
      }
      return res;
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Prevent errors during initial page load
    if (isInitialLoad) {
      console.warn("Request failed during initial load, suppressing error:", url);
      return new Response(JSON.stringify(null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Handle case where queryKey might not be a string
      const url = Array.isArray(queryKey) && queryKey.length > 0 
        ? queryKey[0] 
        : "/";

      if (typeof url !== 'string') {
        console.warn("Invalid queryKey, expected string but got:", typeof url);
        return null;
      }

      try {
        const res = await fetch(url as string, {
          credentials: "same-origin",
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
        });

        if (res.status === 401) {
          if (!isInitialLoad && !isAuthRelatedRequest(url)) {
            console.log(`Auth required for ${url}`);
          }
          return null; // Always return null for 401 errors to prevent errors
        }

        if (!res.ok) {
          const text = (await res.text()) || res.statusText;
          throw new Error(`${res.status}: ${text}`);
        }

        return await res.json();
      } catch (fetchError) {
        // Handle fetch errors silently - this is expected during initial load
        if (!isInitialLoad && !isAuthRelatedRequest(url)) {
          console.warn("Fetch error suppressed:", url);
        }
        return null;
      }
    } catch (error) {
      // Only log errors when not in initial load
      if (!isInitialLoad) {
        console.warn("Query error suppressed for:", queryKey);
      }
      return null; // Always return null for errors to prevent UI breaking
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});