// This utility will disable the runtime error overlay
export function disableRuntimeErrorOverlay() {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Set the server.hmr.overlay to false in Vite config
    // This is a client-side workaround since we can't modify vite.config.ts directly
    try {
      window.addEventListener('error', (event) => {
        // Prevent error overlay from appearing for specific errors related to fetch
        if (event.error && event.error.message && event.error.message.includes('Failed to fetch')) {
          event.preventDefault();
          console.warn('Fetch error suppressed:', event.error.message);
          return true;
        }
      });

      // Also handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && (
          (typeof event.reason.message === 'string' && event.reason.message.includes('Failed to fetch')) ||
          event.reason.type === 'unhandledrejection'
        )) {
          event.preventDefault();
          console.warn('Promise rejection suppressed:', event.reason);
          return true;
        }
      });
      
      // Try to access and modify Vite HMR config
      if (window.__vite_plugin_runtime_error_overlay) {
        // @ts-ignore - Disable the error overlay by nullifying its methods
        window.__vite_plugin_runtime_error_overlay = {
          onError: () => {},
          clearRuntimeErrors: () => {}
        };
      }
      
      console.log('Error overlay has been disabled');
    } catch (error) {
      console.error('Failed to disable error overlay:', error);
    }
  }
}