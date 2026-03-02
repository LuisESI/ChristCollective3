import { isNativeApp } from "./platform";

/**
 * Get the API base URL based on environment
 * - Web: uses relative URLs (same origin)
 * - Mobile: uses full backend URL
 */
export function getApiBaseUrl(): string {
  if (isNativeApp()) {
    // Mobile app: use the deployed backend URL
    return import.meta.env.VITE_API_URL || 'https://christcollective.com';
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
  
  // For mobile apps, we need to handle URLs differently
  if (isNativeApp()) {
    const baseUrl = getApiBaseUrl();
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      try {
        const url = new URL(imageUrl);
        const path = url.pathname;
        if (path.startsWith('/uploads/') || path.startsWith('/objects/')) {
          return `${baseUrl}${path}`;
        }
      } catch (e) {
      }
      return imageUrl;
    }
    
    // Convert relative paths to full URLs
    const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${normalizedPath}`;
  }
  
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      const url = new URL(imageUrl);
      const path = url.pathname;
      if (path.startsWith('/uploads/') || path.startsWith('/objects/')) {
        return `${window.location.origin}${path}`;
      }
    } catch (e) {
    }
    return imageUrl;
  }
  
  // For web, return relative path as-is
  return imageUrl;
}
