(() => {
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

  // Event delegation for data-calculator elements
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-calculator]');
    if (!el) return;
    e.preventDefault();
    showCalculator(el.dataset.calculator);
  });

  // Progressive enhancement on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-calculator]').forEach(el => {
      const slug = routes[el.dataset.calculator];
      if (slug && el.tagName === 'A') {
        el.setAttribute('href', `/calculators/${slug}`);
      }
      el.setAttribute('role', 'link');
      el.setAttribute('tabindex', '0');
      
      // Handle keyboard navigation
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showCalculator(el.dataset.calculator);
        }
      });
    });
  });
})();