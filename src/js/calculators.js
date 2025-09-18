(function bootstrapCalculators() {
  const script = document.currentScript;
  const baseUrl = script ? new URL(script.src) : (typeof window !== 'undefined' ? new URL(window.location.href) : null);
  const initUrl = baseUrl ? new URL('/assets/js/calculators/init.20240218.js', baseUrl).href : '/assets/js/calculators/init.20240218.js';
  const exportUrl = baseUrl ? new URL('/assets/js/core/export.20240218.js', baseUrl).href : '/assets/js/core/export.20240218.js';
  const busUrl = baseUrl ? new URL('/assets/js/core/calcBus.20240218.js', baseUrl).href : '/assets/js/core/calcBus.20240218.js';

  function ensureGlobalNamespace() {
    if (typeof window === 'undefined') return null;
    window.costflowai = window.costflowai || {};
    window.costflowai.calculations = window.costflowai.calculations || new Map();
    return window.costflowai.calculations;
  }

  function getLatestCalculation() {
    const calculations = ensureGlobalNamespace();
    if (!calculations) return null;
    return calculations.get('latest') || null;
  }

  function exposeLegacyExports(exportModule) {
    if (typeof window === 'undefined' || !exportModule) return;
    const { downloadCSV, downloadPDF, triggerPrint, copySummary } = exportModule;

    function guard(action, label) {
      return function actionWrapper() {
        const calculation = getLatestCalculation();
        if (!calculation) {
          console.warn(`CostflowAI: No calculator results available for ${label}. Run a calculation first.`);
          return;
        }
        try {
          action(calculation);
        } catch (error) {
          console.error(`CostflowAI: Failed to ${label}`, error);
        }
      };
    }

    window.copyResults = guard(copySummary, 'copy results');
    window.exportCSV = guard(downloadCSV, 'export CSV');
    window.exportPDF = guard(downloadPDF, 'export PDF');
    window.printResults = guard(triggerPrint, 'print results');
  }

  function exposeDebugUtilities(initCalculators) {
    if (typeof window === 'undefined') return;
    window.initializeAllCalculators = initCalculators || window.initializeAllCalculators;
    window.initializeCalculators = window.initializeAllCalculators;
    window.debugCalculators = function debugCalculators() {
      const active = document.querySelector('.calculator-panel.active, [data-calc].active');
      const panels = Array.from(document.querySelectorAll('.calculator-panel[data-calc], [data-calc]'));
      console.group('CostflowAI Calculators');
      console.log('Active panel:', active?.dataset?.calc || active?.id || 'none');
      console.log('Total panels discovered:', panels.length);
      panels.forEach(panel => {
        const calcId = panel.dataset?.calc || panel.id;
        if (!calcId) return;
        const inputs = panel.querySelectorAll('input, select, textarea');
        const outputs = panel.querySelectorAll('[data-output], .result-value, .result-main');
        console.group(`Panel: ${calcId}`);
        console.log('Inputs:', inputs);
        console.log('Outputs:', outputs);
        console.groupEnd();
      });
      console.groupEnd();
    };
  }

  const ready = Promise.all([
    import(initUrl),
    import(exportUrl).catch(() => null),
    import(busUrl).catch(() => null)
  ]).then(([initModule, exportModule, busModule]) => {
    const { initCalculators } = initModule || {};
    exposeLegacyExports(exportModule);
    exposeDebugUtilities(typeof initCalculators === 'function' ? initCalculators : undefined);

    if (busModule && typeof busModule.subscribe === 'function') {
      const calculations = ensureGlobalNamespace();
      busModule.subscribe('calculator:computed', payload => {
        if (!payload) return;
        const map = ensureGlobalNamespace();
        if (!map) return;
        const key = payload.type || payload.calculator || payload?.inputs?.calculator;
        if (key) {
          map.set(key, payload);
        }
        map.set('latest', payload);
      });
    }

    return initModule;
  }).catch(error => {
    console.error('CostflowAI calculators failed to load', error);
    throw error;
  });

  if (typeof window !== 'undefined') {
    window.costflowCalculatorsReady = ready.then(module => module?.initCalculators);
  }
})();
