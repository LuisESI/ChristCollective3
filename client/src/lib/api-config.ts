import { isNativeApp } from "./platform";

/**
 * Get the API base URL based on environment
 * - Web: uses relative URLs (same origin)
 * - Mobile: uses full backend URL
 */
export function getApiBaseUrl(): string {
  if (isNativeApp()) {
    // Mobile app: use the deployed backend URL
    return import.meta.env.VITE_API_URL || 'https://f854b4eb-c67e-4b56-9fcf-97d9ce2c746c-00-e7qm2jhf778p.picard.replit.dev';
  }
  
  // Web: use relative URLs (same origin)
  return '';
}

/**
 * Build full API URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
}
