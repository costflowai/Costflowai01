/**
 * Optimized Script Loader - Conditional polyfills and deferred loading
 * Reduces critical path and improves Core Web Vitals
 */

(function() {
  'use strict';
  
  // Feature detection for modern browsers
  const browserSupport = {
    hasObjectEntries: typeof Object.entries === 'function',
    hasObjectAssign: typeof Object.assign === 'function',
    hasArrayFrom: typeof Array.from === 'function',
    hasElementClosest: 'closest' in Element.prototype,
    hasPromise: typeof Promise !== 'undefined',
    hasFetch: typeof fetch !== 'undefined',
    hasNodeListForEach: 'forEach' in NodeList.prototype
  };
  
  // Check if polyfills are needed
  const needsPolyfills = !browserSupport.hasObjectEntries || 
                        !browserSupport.hasObjectAssign ||
                        !browserSupport.hasArrayFrom ||
                        !browserSupport.hasElementClosest ||
                        !browserSupport.hasPromise ||
                        !browserSupport.hasNodeListForEach;
  
  // Load scripts based on browser capabilities
  function loadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      
      if (options.defer) script.defer = true;
      if (options.async) script.async = true;
      if (options.module) script.type = 'module';
      
      document.head.appendChild(script);
    });
  }
  
  // Initialize after DOM is ready and first paint
  function initializeScripts() {
    const scripts = [];
    
    // Load polyfills only if needed
    if (needsPolyfills) {
      console.log('Loading polyfills for older browser');
      scripts.push(loadScript('/assets/js/browser-compatibility.js'));
    }
    
    // Load core scripts after polyfills (if any)
    Promise.all(scripts).then(() => {
      // Load display formatter
      return loadScript('/assets/js/display-formatter.js');
    }).then(() => {
      // Load jsPDF for exports
      return loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    }).then(() => {
      // Load new modular calculator system
      return loadScript('/assets/js/calculators/init.js', { module: true });
    }).then(() => {
      console.log('Modular calculator system loaded');
      // Trigger initialization event
      document.dispatchEvent(new CustomEvent('calculatorScriptsReady'));
    }).catch(error => {
      console.error('Error loading calculator scripts:', error);
    });
  }
  
  // Wait for optimal loading time
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Use requestIdleCallback if available for better performance
      if (window.requestIdleCallback) {
        requestIdleCallback(initializeScripts, { timeout: 2000 });
      } else {
        setTimeout(initializeScripts, 0);
      }
    });
  } else {
    if (window.requestIdleCallback) {
      requestIdleCallback(initializeScripts, { timeout: 2000 });
    } else {
      initializeScripts();
    }
  }
})();