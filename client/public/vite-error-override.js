// This script completely disables the Vite error overlay
(function() {
  // Override the error overlay by defining an empty module
  window.__vite_plugin_react_runtime_error_overlay__ = {
    onError: function() {},
    clearRuntimeErrors: function() {}
  };
  
  // Also override all Vite HMR error reporting
  window.__vite_plugin_react_preamble_installed__ = false;
  
  // Set server.hmr.overlay to false
  if (!window.server) window.server = {};
  if (!window.server.hmr) window.server.hmr = {};
  window.server.hmr.overlay = false;
  
  // Capture any runtime errors and prevent them from rendering error overlays
  window.addEventListener('error', function(event) {
    if (event.filename && (
      event.filename.includes('queryClient.ts') ||
      event.message && event.message.includes('Failed to fetch')
    )) {
      console.warn('Prevented error overlay for:', event.message);
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
  
  // Also capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.warn('Suppressed promise rejection:', event.reason);
    event.preventDefault();
    event.stopPropagation();
    return true;
  }, true);
  
  // Look for and remove any existing error overlays
  function removeExistingOverlays() {
    const overlays = document.querySelectorAll('[vite-plugin-react-runtime-error-overlay]');
    overlays.forEach(function(overlay) {
      overlay.remove();
    });
    
    // Also look for elements with specific class names that might be error overlays
    const possibleOverlays = document.querySelectorAll('.vite-error-overlay, .vite-runtime-error');
    possibleOverlays.forEach(function(overlay) {
      overlay.remove();
    });
  }
  
  // Run immediately and also periodically check for and remove overlays
  removeExistingOverlays();
  setInterval(removeExistingOverlays, 100);
  
  console.log('Vite error overlay has been completely disabled');
})();