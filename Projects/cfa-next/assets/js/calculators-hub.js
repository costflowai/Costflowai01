// Manual-only calculator dispatcher for cfa-next
// - Computes ONLY on explicit user action (Calculate / Design)
// - Scope is per-section to avoid cross-ID collisions
// - Stores results in window.lastCalculation (+ byType)
// - Enables Save/Export/Share/Print/Email AFTER a successful compute

(function () {
  const ACTIONS_REQUIRING_COMPUTE = new Set(['calculate','design']);
  const SECONDARY_ACTIONS = new Set(['save','export','share','print','email']);

  function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function findSection(node){
    return node?.closest?.('[data-calc], [id$="-calc"]') || null;
  }

  function sectionSlug(section){
    return section?.dataset?.calc || (section?.id ? section.id.replace(/-calc$/, '') : null);
  }

  function enableActions(section, enabled=true){
    section.querySelectorAll(
      '[data-action="save"],[data-action="export"],[data-action="share"],[data-action="print"],[data-action="email"]'
    ).forEach(btn=>{
      btn.toggleAttribute('disabled', !enabled);
      btn.setAttribute('aria-disabled', String(!enabled));
    });
  }

  // Resolve a compute function by convention and call it
  function callCompute(slug, section){
    const candidates = [
      // Preferred: module style { compute() }
      () => window?.[slug + 'Pro']?.compute?.(section),
      // Generic: compute_slug(section)
      () => window?.['compute_' + slug]?.(section),
      // Legacy: calculateSlug(section)
      () => window?.['calculate' + capitalize(slug)]?.(section),
    ];

    for (const tryCall of candidates) {
      try {
        const res = tryCall?.();
        if (typeof res !== 'undefined') return res; // truthy or explicit object
      } catch (e) {
        console.error(`Compute error for ${slug}:`, e);
        throw e;
      }
    }
    console.warn('No compute function found for', slug);
    return undefined;
  }

  // Normalize compute result into {inputs, results, meta}
  function normalizeResult(slug, raw, section){
    // If compute returned a structured payload, trust it
    if (raw && (raw.results || raw.inputs)) return raw;

    // Otherwise, try to scrape a minimal result from DOM (non-breaking)
    const fallback = {
      inputs: {},
      results: {},
      meta: { sectionId: section?.id || null }
    };
    return fallback;
  }

  function stashLastCalculation(slug, normalized){
    const payload = {
      type: slug,
      title: `${capitalize(slug)} Calculator Results`,
      inputs: normalized.inputs || {},
      results: normalized.results || {},
      timestamp: new Date().toISOString(),
      meta: normalized.meta || {}
    };
    window.lastCalculation = payload;
    window.lastCalculationByType = window.lastCalculationByType || {};
    window.lastCalculationByType[slug] = payload;
    return payload;
  }

  // Prevent Enter in inputs from submitting implicit forms; require explicit click
  document.addEventListener('keydown', (e)=>{
    const el = e.target;
    if (!el) return;
    if (el.matches('input, select, textarea') && e.key === 'Enter') {
      e.preventDefault();
      const section = findSection(el);
      section?.querySelector('[data-action="calculate"],[data-action="design"]')?.click();
    }
  }, true);

  // Delegated click handler for all calculator actions
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest?.('[data-action]');
    if (!btn) return;

    const section = findSection(btn);
    const slug = sectionSlug(section);
    if (!section || !slug) return;

    const action = btn.getAttribute('data-action');

    // Only compute on explicit Calculate/Design
    if (ACTIONS_REQUIRING_COMPUTE.has(action)) {
      e.preventDefault();
      try {
        const result = callCompute(slug, section);
        const normalized = normalizeResult(slug, result, section);
        stashLastCalculation(slug, normalized);
        enableActions(section, true);
        console.log(`✓ ${slug} calculation completed`, normalized);
      } catch (err) {
        console.error(`✗ ${slug} calculation failed`, err);
        enableActions(section, false);
      }
      return;
    }

    // Secondary actions (remain disabled until compute succeeds)
    if (SECONDARY_ACTIONS.has(action)) {
      if (!window?.lastCalculationByType?.[slug]) {
        e.preventDefault();
        console.warn(`No calculation yet for ${slug}; action "${action}" blocked.`);
        return;
      }
      // Bridge hooks will be added in a later step (exports, print, email, etc.)
      console.log(`Action "${action}" triggered for ${slug}`, window.lastCalculationByType[slug]);
    }
  }, true);

  // Expose a tiny API for tests/devtools
  window.calcHub = {
    requestCompute(section, slug, origin='manual'){
      if (origin !== 'manual') return; // forbid programmatic auto-calc
      if (!section) {
        const guess = document.querySelector(`[data-calc="${slug}"], #${slug}-calc`);
        if (!guess) return console.warn('No section found for', slug);
        section = guess;
      }
      const result = callCompute(slug, section);
      const normalized = normalizeResult(slug, result, section);
      stashLastCalculation(slug, normalized);
      enableActions(section, true);
      return normalized;
    },
    enableActions,
  };
})();