/**
 * Legacy calculators entry point.
 *
 * Pages still referencing /js/calculators.js or /assets/js/calculators.js
 * are upgraded to load the modern module-based calculator suite without
 * duplicating business logic or relying on invalid selectors.
 */
(function () {
  const MODULE_URL = '/assets/js/calculator-suite.20240218.js';
  let modulePromise = null;

  function loadModule() {
    if (!modulePromise) {
      modulePromise = import(MODULE_URL).catch(error => {
        console.error('CostFlowAI calculators failed to load', error);
        throw error;
      });
    }
    return modulePromise;
  }

  function boot() {
    loadModule()
      .then(module => {
        if (module && typeof module.initCalculators === 'function') {
          module.initCalculators();
        }
      })
      .catch(() => {
        // Error already reported in loadModule
      });
  }

  window.initializeAllCalculators = function initializeAllCalculators() {
    return loadModule().then(module => module?.initCalculators?.());
  };
  window.initializeCalculators = window.initializeAllCalculators;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }
})();
