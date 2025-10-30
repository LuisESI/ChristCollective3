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

/**
 * Convert image URL to full URL for mobile apps
 * - Web: returns the URL as-is (relative paths work)
 * - Mobile: prepends backend URL to relative paths
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  
  // If already a full URL (http/https), return as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // For mobile apps, convert relative paths to full URLs
  if (isNativeApp()) {
    const baseUrl = getApiBaseUrl();
    const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${normalizedPath}`;
  }
  
  // For web, return relative path as-is
  return imageUrl;
}
