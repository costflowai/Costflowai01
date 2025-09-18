import { init as initConcrete } from './calculators/concrete_slab_pro.js';

window.addEventListener('DOMContentLoaded', () => {
  const calculatorRoot = document.querySelector('[data-calculator="concrete-slab-pro"]');
  if (calculatorRoot) {
    initConcrete(calculatorRoot);
  }
});
