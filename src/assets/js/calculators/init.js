import { wireCalculator, addRegionalPricing } from './runner.js';
import './concrete.js';
import './paint.js';
import './framing.js';

const CONFIG = {
  concrete: {
    sectionSelector: '#concrete-calc',
    inputSelectors: {
      lengthFt: '#concrete-length',
      widthFt: '#concrete-width',
      thicknessIn: '#concrete-thickness',
      psi: '#concrete-psi',
      pourType: '#concrete-type',
      rebarType: '#concrete-rebar',
      deliveryType: '#concrete-delivery',
      region: '#region-selector'
    },
    outputSelectors: {
      areaSqFt: '#concrete-area',
      baseYards: '#concrete-base-yards',
      adjustedYards: '#concrete-yards',
      materialCost: '#concrete-material-cost',
      laborCost: '#concrete-labor-cost',
      rebarCost: '#concrete-rebar-cost',
      deliveryCost: '#concrete-delivery-cost',
      totalCost: '#concrete-total-cost'
    },
    calculateButton: '[data-action="calculate"]'
  },
  framing: {
    sectionSelector: '#framing-calc',
    inputSelectors: {
      wallLengthFt: '#framing-length',
      wallHeightFt: '#framing-height',
      spacing: '#framing-spacing',
      lumberSize: '#framing-lumber',
      region: '#region-selector'
    },
    outputSelectors: {
      studCount: '#framing-studs',
      platesLinearFeet: '#framing-plates',
      areaSqFt: '#framing-area',
      studCost: '#framing-stud-cost',
      sheathingCost: '#framing-sheathing-cost',
      hardwareCost: '#framing-hardware-cost',
      laborCost: '#framing-labor-cost',
      totalCost: '#framing-total-cost'
    },
    calculateButton: '[data-action="calculate"]'
  },
  paint: {
    sectionSelector: '#paint-calc',
    inputSelectors: {
      wallAreaSqFt: '#paint-area',
      openingsSqFt: '#paint-openings',
      coats: '#paint-coats',
      texture: '#paint-texture',
      quality: '#paint-quality',
      includePrimer: '#paint-primer',
      region: '#region-selector'
    },
    outputSelectors: {
      paintableArea: '#paint-paintable-area',
      gallonsNeeded: '#paint-gallons',
      primerGallons: '#paint-primer-gallons',
      paintCost: '#paint-cost',
      primerCost: '#paint-primer-cost',
      laborCost: '#paint-labor-cost',
      materialCost: '#paint-material-cost',
      totalCost: '#paint-total-cost'
    },
    calculateButton: '[data-action="calculate"]'
  }
};

function init(calculatorKey) {
  const config = CONFIG[calculatorKey];
  if (!config) return;
  const section = document.querySelector(config.sectionSelector);
  if (!section) return;
  wireCalculator(calculatorKey, config);
  addRegionalPricing(section);
}

export function initCalculators() {
  Object.keys(CONFIG).forEach(init);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculators);
} else {
  initCalculators();
}
