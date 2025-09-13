// CostFlowAI analytics events (GA4). Autodetects calculator pages and wires common buttons.
(function(){
  function whenReady(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function toolFromPath(p){
    if(p.includes('residential-rom-pro')) return 'residential-rom-pro';
    if(p.includes('residential-rom')) return 'residential-rom';
    if(p.includes('commercial-ti-pro')) return 'commercial-ti-pro';
    if(p.includes('commercial-ti')) return 'commercial-ti';
    if(p.includes('concrete-pro')) return 'concrete-pro';
    if(p.includes('concrete')) return 'concrete';
    if(p.includes('gc-general-conditions')) return 'gc-general-conditions';
    if(p.includes('cleanroom-fitout')) return 'cleanroom-fitout';
    return 'unknown';
  }
  function send(eventName, props){
    if(typeof gtag === 'function'){
      gtag('event', eventName, Object.assign({page_path: location.pathname}, props||{}));
    } else {
      console.warn('GA4 gtag() not found; event skipped', eventName, props);
    }
  }

  // Calculator navigation function - FIX for "showCalculator is not defined" errors
  const routes = {
    concrete: 'concrete',
    framing: 'framing', 
    drywall: 'drywall',
    roofing: 'roofing',
    flooring: 'flooring',
    painting: 'paint',
    paint: 'paint',
    electrical: 'electrical',
    plumbing: 'plumbing',
    hvac: 'hvac',
    insulation: 'insulation',
    landscaping: 'landscaping',
    fencing: 'fencing',
    excavation: 'excavation',
    labor: 'labor',
    roi: 'roi'
  };

  function showCalculator(type) {
    const slug = routes[type];
    if (slug) {
      location.assign(`/calculators/${slug}`);
    } else {
      alert(`Calculator coming soon: ${type}`);
    }
  }

  // Make globally available for legacy calls
  window.showCalculator = showCalculator;
  whenReady(function(){
    // Calculator events
    var tool = toolFromPath(location.pathname);
    var calcBtn = document.querySelector('#calc');
    if(calcBtn){ calcBtn.addEventListener('click', function(){ send('calc_run', {tool: tool}); }); }
    var csvBtn = document.querySelector('#csv');
    if(csvBtn){ csvBtn.addEventListener('click', function(){ send('csv_download', {tool: tool}); }); }
    // Contact form event
    var contact = document.querySelector('form[name="contact"]');
    if(contact){ contact.addEventListener('submit', function(){ send('contact_submit', {}); }); }
    
    // Event delegation for calculator buttons
    document.body.addEventListener('click', function(e){
      var el = e.target.closest('[data-calculator]');
      if (el) {
        e.preventDefault();
        showCalculator(el.dataset.calculator);
        return;
      }
      
      // Outbound link tracking
      var a = e.target.closest('a[href^="http"]');
      if(a && a.host !== location.host){ send('outbound_click', {href:a.href}); }
    }, true);
    
    // Progressive enhancement for calculator buttons
    document.querySelectorAll('[data-calculator]').forEach(function(el) {
      var slug = routes[el.dataset.calculator];
      if (slug && el.tagName === 'A') {
        el.setAttribute('href', '/calculators/' + slug);
      }
      el.setAttribute('role', 'link');
      el.setAttribute('tabindex', '0');
      
      // Handle keyboard navigation
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showCalculator(el.dataset.calculator);
        }
      });
    });

    // Debug: Verify function is available
    console.log('CostFlowAI calc-events loaded. showCalculator available:', typeof window.showCalculator);
  });
})();
