/**
 * Robust Tab Router - Drop-in replacement that handles DOM mapping
 */

(function(){
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const norm = s => (s||'').toLowerCase().trim();

  // Build map from DOM (no hardcoded names)
  const tabs   = $$('[data-target]');
  const panels = $$('.calculator-panel[id]');
  const map = new Map();
  
  tabs.forEach(btn => {
    const target = norm(btn.dataset.target);
    const ariaControls = norm(btn.getAttribute('aria-controls'));
    
    // Try both data-target and aria-controls as panel ID
    let panel = null;
    if (target) panel = $('#' + CSS.escape(target + '-calc')) || $('#' + CSS.escape(target));
    if (!panel && ariaControls) panel = $('#' + CSS.escape(ariaControls));
    
    if (target && panel) {
      map.set(target, {btn, panel});
      console.log(`Mapped tab "${target}" to panel "${panel.id}"`);
    }
  });

  function wirePanel(p) {
    if (p.dataset.wired === '1') return;
    p.dataset.wired = '1';
    console.log(`Wiring panel: ${p.id}`);
    
    // Call your registered calculator init if present
    const calcType = p.dataset.calc || p.id.replace('-calc', '');
    if (window.CFAI?.init) {
      window.CFAI.init(calcType, p);
    }
    
    // Trigger calculator initialization for modular system
    const initEvent = new CustomEvent('calculatorPanelActivated', {
      detail: { calculatorType: calcType, panel: p }
    });
    document.dispatchEvent(initEvent);
  }

  function activate(slug) {
    const entry = map.get(norm(slug)) || [...map.values()][0];
    if (!entry) {
      console.warn(`No calculator found for slug: ${slug}. Available:`, Array.from(map.keys()));
      return;
    }
    
    console.log(`Activating calculator: ${slug}`);
    
    // Update tab states
    tabs.forEach(t => {
      const isActive = t === entry.btn;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    
    // Update panel states
    panels.forEach(p => {
      const isActive = p === entry.panel;
      p.classList.toggle('active', isActive);
      p.hidden = !isActive;
      if (isActive) {
        wirePanel(p);
      }
    });
    
    // Update URL hash (normalize to panel ID without -calc suffix)
    const hashSlug = entry.panel.id.replace('-calc', '');
    if (location.hash.slice(1) !== hashSlug) {
      history.replaceState(null, '', '#' + hashSlug);
    }
  }

  // Handle clicks (robust to nested spans/icons)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-target]');
    if (!btn) return;
    e.preventDefault();
    activate(btn.dataset.target);
  });

  // Handle deep links
  const fromHash = () => {
    const hash = location.hash.slice(1);
    if (hash) {
      activate(hash);
    } else {
      // Default to first calculator
      const firstKey = map.keys().next().value;
      if (firstKey) activate(firstKey);
    }
  };
  
  window.addEventListener('hashchange', fromHash);
  document.addEventListener('DOMContentLoaded', fromHash);

  // If modules register late, re-run activation
  const prev = (window.CFAI?.register) || function(){};
  window.CFAI = window.CFAI || {};
  window.CFAI.register = (k, impl) => { 
    prev(k, impl); 
    fromHash(); 
  };
  
  // Expose for debugging
  window.CFAI.router = { map, activate, fromHash };
  
  console.log('Calculator router initialized with', map.size, 'calculators');
})();

// Export for module compatibility (not used in drop-in version)
export function initHashTabs() {
  // Router is already initialized in IIFE above
  console.log('Hash tabs router already active');
}