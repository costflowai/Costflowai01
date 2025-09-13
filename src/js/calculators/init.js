/**
 * Calculator Initialization - Wire all calculators to the page
 */

import { wireCalculator, addRegionalPricing } from './runner.js';
import { initHashTabs } from '../ui/hash-tabs.js';
import './concrete.js';
import './paint.js';
import './framing.js';
import './roofing.js';

// Calculator configurations
const CALCULATOR_CONFIGS = {
  concrete: {
    sectionSelector: '#concrete-calculator',
    inputSelectors: {
      lengthFt: '#concrete-length',
      widthFt: '#concrete-width', 
      thicknessIn: '#concrete-thickness',
      psi: '#concrete-psi',
      pourType: '#concrete-pour-type',
      rebarType: '#concrete-rebar',
      deliveryType: '#concrete-delivery',
      region: '#region-selector'
    },
    outputSelectors: {
      volume: '#concrete-volume',
      yards: '#concrete-yards',
      area: '#concrete-area',
      materialCost: '#concrete-material-cost',
      rebarCost: '#concrete-rebar-cost',
      laborCost: '#concrete-labor-cost',
      totalCost: '#concrete-total-cost'
    },
    calculateButton: '[data-action="calculate"]',
    formulaContainer: '#concrete-formula'
  },
  
  paint: {
    sectionSelector: '#paint-calculator',
    inputSelectors: {
      wallArea: '#paint-wall-area',
      openings: '#paint-openings',
      coats: '#paint-coats',
      texture: '#paint-texture',
      quality: '#paint-quality', 
      needsPrimer: '#paint-needs-primer',
      region: '#region-selector'
    },
    outputSelectors: {
      paintableArea: '#paint-paintable-area',
      paintGallons: '#paint-gallons',
      primerGallons: '#paint-primer-gallons',
      paintCost: '#paint-cost',
      primerCost: '#paint-primer-cost',
      materialCost: '#paint-material-cost',
      laborCost: '#paint-labor-cost',
      totalCost: '#paint-total-cost'
    },
    calculateButton: '[data-action="calculate"]',
    formulaContainer: '#paint-formula'
  },
  
  framing: {
    sectionSelector: '#framing-calculator',
    inputSelectors: {
      area: '#framing-area',
      framingType: '#framing-type',
      lumberSize: '#framing-lumber-size',
      lumberGrade: '#framing-lumber-grade',
      spacing: '#framing-spacing',
      region: '#region-selector'
    },
    outputSelectors: {
      linearFeet: '#framing-linear-feet',
      boardFeet: '#framing-board-feet',
      materialCost: '#framing-material-cost',
      hardwareCost: '#framing-hardware-cost',
      laborCost: '#framing-labor-cost',
      totalCost: '#framing-total-cost'
    },
    calculateButton: '[data-action="calculate"]',
    formulaContainer: '#framing-formula'
  },
  
  roofing: {
    sectionSelector: '#roofing-calculator',
    inputSelectors: {
      length: '#roofing-length',
      width: '#roofing-width',
      pitch: '#roofing-pitch',
      material: '#roofing-material',
      underlayment: '#roofing-underlayment',
      complexity: '#roofing-complexity',
      tearOff: '#roofing-tear-off',
      region: '#region-selector'
    },
    outputSelectors: {
      roofArea: '#roofing-area',
      squares: '#roofing-squares',
      materialCost: '#roofing-material-cost',
      laborCost: '#roofing-labor-cost',
      totalCost: '#roofing-total-cost'
    },
    calculateButton: '[data-action="calculate"]',
    formulaContainer: '#roofing-formula'
  }
};

/**
 * Initialize all calculators on page load
 */
export function initCalculators() {
  console.log('Initializing modular calculator system...');
  
  // Initialize hash-based routing
  initHashTabs();
  
  // Set up global CFAI object for router integration
  window.CFAI = window.CFAI || {};
  window.CFAI.init = initSpecificCalculator;
  
  // Listen for panel activation events from router
  document.addEventListener('calculatorPanelActivated', (e) => {
    const { calculatorType, panel } = e.detail;
    console.log(`Panel activated: ${calculatorType}`);
    initSpecificCalculator(calculatorType, panel);
  });
  
  console.log('Calculator initialization complete');
}

/**
 * Initialize a specific calculator when its panel becomes active
 */
function initSpecificCalculator(calculatorType, panel) {
  const config = CALCULATOR_CONFIGS[calculatorType];
  if (!config) {
    console.warn(`No config found for calculator: ${calculatorType}`);
    return;
  }
  
  // Update selector to use the actual panel instead of document
  const sectionSelector = `#${panel.id}`;
  const updatedConfig = {
    ...config,
    sectionSelector
  };
  
  console.log(`Wiring calculator: ${calculatorType} in panel ${panel.id}`);
  wireCalculator(calculatorType, updatedConfig);
  
  // Add regional pricing if selector exists
  addRegionalPricing(panel, () => {
    // Re-calculate when region changes
    const calculator = panel.querySelector('[data-action="calculate"]');
    if (calculator) calculator.click();
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculators);
} else {
  initCalculators();
}