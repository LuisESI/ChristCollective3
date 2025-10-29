import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from "./api-config";

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
  url: string,
  options?: {
    method?: string;
    data?: unknown;
  }
): Promise<Response> {
  const method = options?.method || 'GET';
  const data = options?.data;
  
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (data) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Add session ID header for mobile apps
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    const fullUrl = buildApiUrl(url);
    const res = await fetch(fullUrl, {
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
      // Construct URL from queryKey array segments
      let url: string;
      if (Array.isArray(queryKey) && queryKey.length > 0) {
        // Join array elements to create the full URL path
        url = queryKey.filter(Boolean).join('/');
      } else {
        url = "/";
      }

      if (typeof url !== 'string') {
        console.warn("Invalid queryKey, expected string but got:", typeof url);
        return null;
      }

      try {
        const fullUrl = buildApiUrl(url as string);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Add session ID header for mobile apps
        const sessionId = localStorage.getItem('sessionId');
        if (sessionId) {
          headers['X-Session-ID'] = sessionId;
        }
        
        const res = await fetch(fullUrl, {
          credentials: "include",
          headers,
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