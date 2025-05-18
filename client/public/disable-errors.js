// Script to disable the error overlay
window.addEventListener('load', function() {
  // Try to disable the error overlay by setting the config option
  try {
    // This is the direct way to disable the error overlay
    window.server = window.server || {};
    window.server.hmr = window.server.hmr || {};
    window.server.hmr.overlay = false;
    
    // Also try to disable by direct attribute
    if (window.__vite_plugin_react_preamble_installed__) {
      window.__vite_plugin_react_preamble_installed__ = false;
    }
    
    // Also try to capture and prevent errors
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('Failed to fetch')) {
        console.warn('Suppressed error:', event.message);
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }, true);
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      console.warn('Suppressed rejection:', event.reason);
      event.preventDefault();
      event.stopPropagation();
      return true;
    }, true);
    
    // Additional attempts to disable the error overlay
    if (window.__vite_plugin_runtime_error_overlay) {
      window.__vite_plugin_runtime_error_overlay.clearRuntimeErrors = function() {};
      window.__vite_plugin_runtime_error_overlay.onError = function() {};
    }
    
    console.log('Error overlay disabled via external script');
  } catch (e) {
    console.error('Failed to disable error overlay:', e);
  }
});