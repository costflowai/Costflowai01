import bus from '../core/bus.js';
import { createValidator } from '../core/validate.js';
import {
  toFeet,
  toInches,
  toCubicYardsFromFeet,
  formatNumber,
  formatCurrency,
  convertVolumeForDisplay,
  unitsConfig
} from '../core/units.js';
import { getPricing } from '../core/pricing.js';
import { downloadCSV, downloadXLSX, downloadPDF, triggerPrint } from '../core/export.js';
import { announce } from '../core/a11y.js';

const PREFS_KEY = 'costflowai:concrete-slab-pro:prefs';
const REQUIRED_FIELDS = ['length', 'width', 'thickness', 'waste', 'productivity'];

const schema = {
  length: { required: true, numeric: true, positive: true },
  width: { required: true, numeric: true, positive: true },
  thickness: { required: true, numeric: true, positive: true, min: 2 },
  waste: { required: true, numeric: true, min: 0, max: 20 },
  rebarGrid: { required: true, options: ['12', '18', '24'] },
  rebarLap: { required: true, numeric: true, min: 12, max: 48 },
  productivity: { required: true, numeric: true, positive: true }
};

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { units: 'imperial', region: 'National' };
    const parsed = JSON.parse(raw);
    return {
      units: parsed.units === 'metric' ? 'metric' : 'imperial',
      region: parsed.region || 'National'
    };
  } catch (error) {
    console.warn('Unable to load preferences', error);
    return { units: 'imperial', region: 'National' };
  }
};

const savePrefs = (prefs) => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn('Unable to persist preferences', error);
  }
};

const updateUnitHints = (form, units) => {
  const config = unitsConfig[units] ?? unitsConfig.imperial;
  const lengthEl = form.querySelector('[data-units-length]');
  const widthEl = form.querySelector('[data-units-width]');
  const thicknessEl = form.querySelector('[data-units-thickness]');
  if (lengthEl) lengthEl.textContent = config.lengthPlaceholder;
  if (widthEl) widthEl.textContent = config.lengthPlaceholder;
  if (thicknessEl) thicknessEl.textContent = config.thicknessPlaceholder;
};

const stateFromForm = (form, units) => ({
  units,
  length: form.length.value,
  width: form.width.value,
  thickness: form.thickness.value,
  waste: form.waste.value,
  rebarGrid: form.rebarGrid.value,
  rebarLap: form.rebarLap.value,
  concreteUnitPrice: form.concreteUnitPrice.value,
  laborRate: form.laborRate.value,
  productivity: form.productivity.value,
  pumpFlat: form.pumpFlat.value,
  region: form.region.value,
  applyMarkup: form.applyMarkup.checked,
  applyTax: form.applyTax.checked
});

export const compute = (state, pricing) => {
  if (!pricing) {
    throw new Error('Pricing data required for computation');
  }
  const lengthFt = state.units === 'metric' ? toFeet(state.length, 'm') : toFeet(state.length, 'ft');
  const widthFt = state.units === 'metric' ? toFeet(state.width, 'm') : toFeet(state.width, 'ft');
  const thicknessIn = state.units === 'metric' ? toInches(state.thickness, 'cm') : toInches(state.thickness, 'in');
  const wastePercent = Number(state.waste) / 100;
  const rebarGrid = Number(state.rebarGrid);
  const lapIn = Number(state.rebarLap);
  const productivity = Number(state.productivity);

  const concreteUnitPrice = Number(state.concreteUnitPrice) || pricing.materials.concrete.unitPrice;
  const laborRate = Number(state.laborRate) || pricing.labor.rate;
  const pumpFlat = Number(state.pumpFlat) || pricing.equipment.pumpFlat;

  const volumeFt3 = lengthFt * widthFt * (thicknessIn / 12);
  const volumeYd3 = toCubicYardsFromFeet(volumeFt3);
  const volumeYd3Waste = volumeYd3 * (1 + wastePercent);

  const barsX = Math.ceil((widthFt * 12) / rebarGrid) + 1;
  const barsY = Math.ceil((lengthFt * 12) / rebarGrid) + 1;
  const spliceCount = Math.max(barsX - 1, 0) + Math.max(barsY - 1, 0);
  const lapFt = (lapIn / 12) * spliceCount;
  const totalRebarFt = barsX * lengthFt + barsY * widthFt + lapFt;
  const rebarCost = totalRebarFt * pricing.materials.rebar['#4'].unitPrice;

  const concreteCost = volumeYd3Waste * concreteUnitPrice;
  const materialCost = concreteCost + rebarCost;

  const laborHours = volumeYd3Waste / productivity;
  const laborCost = laborHours * laborRate;
  const equipmentCost = pumpFlat;

  const subtotal = materialCost + laborCost + equipmentCost;
  const markupRate = state.applyMarkup ? pricing.financial.markupRate : 0;
  const markupValue = subtotal * markupRate;
  const taxRate = state.applyTax ? pricing.financial.taxRate : 0;
  const taxableBase = subtotal + markupValue;
  const taxValue = taxableBase * taxRate;
  const total = subtotal + markupValue + taxValue;

  return {
    inputs: {
      lengthFt,
      widthFt,
      thicknessIn,
      wastePercent,
      rebarGrid,
      lapIn,
      productivity,
      overrides: {
        concreteUnitPrice: Boolean(Number(state.concreteUnitPrice)),
        laborRate: Boolean(Number(state.laborRate)),
        pumpFlat: Boolean(Number(state.pumpFlat))
      }
    },
    pricing,
    results: {
      volumeFt3,
      volumeYd3,
      volumeYd3Waste,
      barsX,
      barsY,
      totalRebarFt,
      lapFt,
      rebarCost,
      concreteCost,
      materialCost,
      laborHours,
      laborCost,
      equipmentCost,
      concreteUnitPrice,
      laborRate,
      pumpFlat,
      markupRate,
      markupValue,
      taxRate,
      taxValue,
      subtotal,
      total
    }
  };
};

const buildEntries = (state, result) => {
  const { results } = result;
  const unitsLabel = state.units === 'metric' ? 'm' : 'ft';
  const thicknessUnit = state.units === 'metric' ? 'cm' : 'in';
  const volumeUnit = state.units === 'metric' ? 'm³' : 'yd³';
  const stateEntries = [
    ['Units', state.units],
    ['Region', state.region],
    [`Length (${unitsLabel})`, state.length],
    [`Width (${unitsLabel})`, state.width],
    [`Thickness (${thicknessUnit})`, state.thickness],
    ['Waste (%)', state.waste],
    ['Rebar grid (in)', state.rebarGrid],
    ['Rebar lap (in)', state.rebarLap],
    ['Concrete unit price override', state.concreteUnitPrice || 'Pricing dataset'],
    ['Labor rate override', state.laborRate || 'Pricing dataset'],
    ['Productivity (yd³/hr)', state.productivity],
    ['Pump flat ($)', state.pumpFlat || 'Pricing dataset'],
    ['Apply markup', state.applyMarkup ? 'Yes' : 'No'],
    ['Apply tax', state.applyTax ? 'Yes' : 'No']
  ];

  const resultEntries = [
    [`Concrete volume (${volumeUnit})`, formatNumber(results.volumeYd3Waste, { maximumFractionDigits: 3 })],
    ['Rebar total (ft)', formatNumber(results.totalRebarFt, { maximumFractionDigits: 0 })],
    ['Bars (X direction)', results.barsX],
    ['Bars (Y direction)', results.barsY],
    ['Labor hours', formatNumber(results.laborHours, { maximumFractionDigits: 2 })],
    ['Concrete unit price used', formatCurrency(results.concreteUnitPrice)],
    ['Labor rate used', formatCurrency(results.laborRate)],
    ['Equipment flat used', formatCurrency(results.pumpFlat)],
    ['Material cost', formatCurrency(results.materialCost)],
    ['Labor cost', formatCurrency(results.laborCost)],
    ['Equipment', formatCurrency(results.equipmentCost)],
    ['Markup', formatCurrency(results.markupValue)],
    ['Tax', formatCurrency(results.taxValue)],
    ['Subtotal', formatCurrency(results.subtotal)],
    ['Estimate total', formatCurrency(results.total)]
  ];

  return [...stateEntries, ...resultEntries];
};

export const explain = (state, result) => {
  const { inputs, results } = result;
  const markupPercent = formatNumber(results.markupRate * 100, { maximumFractionDigits: 1 });
  const taxPercent = formatNumber(results.taxRate * 100, { maximumFractionDigits: 2 });
  const volumeCalc = `${formatNumber(inputs.lengthFt, { maximumFractionDigits: 2 })} ft × ${formatNumber(inputs.widthFt, {
    maximumFractionDigits: 2
  })} ft × (${formatNumber(inputs.thicknessIn, { maximumFractionDigits: 2 })} in ÷ 12)`;
  const rebarCalc = `${results.barsX} bars × ${formatNumber(inputs.lengthFt, {
    maximumFractionDigits: 2
  })} ft + ${results.barsY} bars × ${formatNumber(inputs.widthFt, { maximumFractionDigits: 2 })} ft + laps (${formatNumber(
    results.lapFt,
    { maximumFractionDigits: 2 }
  )} ft)`;

  return `### Volume
Volume_ft³ = ${volumeCalc} = ${formatNumber(results.volumeFt3, { maximumFractionDigits: 2 })} ft³

Volume_yd³ = ${formatNumber(results.volumeFt3, {
    maximumFractionDigits: 2
  })} ft³ ÷ 27 = ${formatNumber(results.volumeYd3, { maximumFractionDigits: 3 })} yd³

Waste applied (${formatNumber(inputs.wastePercent * 100, {
    maximumFractionDigits: 1
  })}%) => ${formatNumber(results.volumeYd3Waste, { maximumFractionDigits: 3 })} yd³

### Reinforcement
bars_X = ceil((width × 12) ÷ grid) + 1 = ${results.barsX}

bars_Y = ceil((length × 12) ÷ grid) + 1 = ${results.barsY}

Total ft = ${rebarCalc} = ${formatNumber(results.totalRebarFt, { maximumFractionDigits: 0 })} ft

### Costs
Concrete = unitPrice × volume = ${formatCurrency(results.concreteUnitPrice)} × ${formatNumber(
    results.volumeYd3Waste,
    { maximumFractionDigits: 3 }
  )} = ${formatCurrency(results.concreteCost)}

Rebar = ${formatNumber(results.totalRebarFt, { maximumFractionDigits: 0 })} ft × ${formatCurrency(
    result.pricing.materials.rebar['#4'].unitPrice
  )}/ft = ${formatCurrency(results.rebarCost)}

Labor = (${formatNumber(results.volumeYd3Waste, { maximumFractionDigits: 3 })} ÷ ${formatNumber(inputs.productivity, {
    maximumFractionDigits: 2
  })}) × ${formatCurrency(results.laborRate)} = ${formatCurrency(results.laborCost)}

Equipment = ${formatCurrency(results.equipmentCost)}

Subtotal = ${formatCurrency(results.subtotal)}

Markup (${markupPercent}%) = ${formatCurrency(results.markupValue)}

Tax (${taxPercent}%) = ${formatCurrency(results.taxValue)}

**Total = ${formatCurrency(results.total)}**`;
};

const renderInlineErrors = (form, validator) => {
  Object.entries(schema).forEach(([name]) => {
    const field = form[name];
    if (!field) return;
    const group = field.closest('.input-group');
    const messageEl = group?.querySelector('.input-error');
    const errors = validator.getFieldErrors(name);
    if (errors.length) {
      group?.classList.add('has-error');
      if (messageEl) {
        messageEl.textContent = errors[0];
      }
    } else {
      group?.classList.remove('has-error');
      if (messageEl) {
        messageEl.textContent = '';
      }
    }
  });
};

const renderErrorSummary = (summaryEl, validator, form) => {
  const errors = validator.getErrors();
  if (!errors.size) {
    summaryEl.hidden = true;
    summaryEl.innerHTML = '';
    return;
  }
  const list = Array.from(errors.entries())
    .map(([name, fieldErrors]) => {
      const label = form[name]?.labels?.[0]?.textContent ?? name;
      return `<li><strong>${label}</strong>: ${fieldErrors.join(', ')}</li>`;
    })
    .join('');
  summaryEl.hidden = false;
  summaryEl.innerHTML = `<h2>Check the highlighted fields</h2><ul>${list}</ul>`;
};

const renderQuantities = (result, container, units) => {
  const { results } = result;
  const volumeDisplay = convertVolumeForDisplay(results.volumeYd3Waste, units);
  const volumeUnit = units === 'metric' ? 'm³ (with waste)' : 'yd³ (with waste)';
  container.innerHTML = `
    <dl class="quantities">
      <div>
        <dt>Concrete volume</dt>
        <dd>${formatNumber(volumeDisplay, { maximumFractionDigits: 3 })} ${volumeUnit}</dd>
      </div>
      <div>
        <dt>Rebar length</dt>
        <dd>${formatNumber(results.totalRebarFt, { maximumFractionDigits: 0 })} ft of #4</dd>
      </div>
      <div>
        <dt>Grid layout</dt>
        <dd>${results.barsX} bars (X) / ${results.barsY} bars (Y)</dd>
      </div>
      <div>
        <dt>Waste allowance</dt>
        <dd>${formatNumber(result.inputs.wastePercent * 100, { maximumFractionDigits: 1 })}% included</dd>
      </div>
    </dl>
  `;
};

const renderCosts = (result, container) => {
  const { results } = result;
  container.innerHTML = `
    <table class="cost-breakdown">
      <caption>Cost breakdown</caption>
      <thead>
        <tr><th scope="col">Component</th><th scope="col" class="numeric">Amount</th></tr>
      </thead>
      <tbody>
        <tr><th scope="row">Material</th><td class="numeric">${formatCurrency(results.materialCost)}</td></tr>
        <tr><th scope="row">Labor</th><td class="numeric">${formatCurrency(results.laborCost)}</td></tr>
        <tr><th scope="row">Equipment</th><td class="numeric">${formatCurrency(results.equipmentCost)}</td></tr>
        <tr><th scope="row">Markup</th><td class="numeric">${formatCurrency(results.markupValue)}</td></tr>
        <tr><th scope="row">Tax</th><td class="numeric">${formatCurrency(results.taxValue)}</td></tr>
      </tbody>
      <tfoot>
        <tr><th scope="row">Total</th><td class="numeric">${formatCurrency(results.total)}</td></tr>
      </tfoot>
    </table>
  `;
};

const updateOverrideBadge = (badge, overrides) => {
  if (overrides.concreteUnitPrice || overrides.laborRate || overrides.pumpFlat) {
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
};

const hasAllRequiredValues = (form) =>
  REQUIRED_FIELDS.every((name) => form[name]?.value.trim() !== '');

const setButtonState = (button, form, validator) => {
  const enabled = validator.isValid() && hasAllRequiredValues(form);
  button.disabled = !enabled;
  button.setAttribute('aria-disabled', String(!enabled));
};

export const init = async (element) => {
  const form = element.querySelector('form');
  const calculateBtn = element.querySelector('[data-action="calculate"]');
  const resultsPanel = element.querySelector('[data-results]');
  const quantities = element.querySelector('[data-quantities]');
  const breakdown = element.querySelector('[data-breakdown]');
  const showMathTarget = element.querySelector('[data-show-math]');
  const summary = element.querySelector('[data-error-summary]');
  const liveRegion = element.querySelector('[data-live]');
  const overrideBadge = element.querySelector('[data-override-badge]');

  const prefs = loadPrefs();
  form.region.value = prefs.region;
  form.units.value = prefs.units;
  updateUnitHints(form, prefs.units);

  const validator = createValidator(schema);

  let currentPricing = await getPricing(prefs.region);
  let currentResult = null;

  const handleFieldBlur = (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const name = event.target.name;
    if (!name) return;
    const valid = validator.validateField(name, event.target.value);
    renderInlineErrors(form, validator);
    setButtonState(calculateBtn, form, validator);
    if (!valid) {
      announce(liveRegion, `${event.target.labels?.[0]?.textContent ?? name} needs attention`);
    }
  };

  form.addEventListener('blur', handleFieldBlur, true);

  form.addEventListener('input', (event) => {
    if (!(event.target instanceof HTMLElement)) return;
    const name = event.target.name;
    if (!name) return;
    validator.validateField(name, event.target.value);
    renderInlineErrors(form, validator);
    setButtonState(calculateBtn, form, validator);
  });

  form.region.addEventListener('change', async () => {
    prefs.region = form.region.value;
    savePrefs(prefs);
    currentPricing = await getPricing(form.region.value);
  });

  form.units.addEventListener('change', () => {
    prefs.units = form.units.value;
    updateUnitHints(form, prefs.units);
    savePrefs(prefs);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const state = stateFromForm(form, form.units.value);
    const valid = validator.validateAll(state);
    renderInlineErrors(form, validator);
    renderErrorSummary(summary, validator, form);
    if (!validator.isValid()) {
      announce(liveRegion, 'There are validation errors.');
      summary.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    currentResult = compute(state, currentPricing);
    renderQuantities(currentResult, quantities, form.units.value);
    renderCosts(currentResult, breakdown);
    showMathTarget.textContent = explain(state, currentResult);
    resultsPanel.hidden = false;
    announce(liveRegion, `Estimate total ${formatCurrency(currentResult.results.total)}`);
    updateOverrideBadge(overrideBadge, currentResult.inputs.overrides);
    bus.publish('calculator:computed', {
      id: 'concrete-slab-pro',
      total: currentResult.results.total,
      state,
      results: currentResult.results
    });
  });

  form.addEventListener('reset', () => {
    validator.validateAll({});
    const errorBag = validator.getErrors();
    if (typeof errorBag.clear === 'function') {
      errorBag.clear();
    }
    renderInlineErrors(form, validator);
    renderErrorSummary(summary, validator, form);
    resultsPanel.hidden = true;
    overrideBadge.hidden = true;
    showMathTarget.textContent = '';
    quantities.innerHTML = '';
    breakdown.innerHTML = '';
    currentResult = null;
    setButtonState(calculateBtn, form, validator);
    bus.publish('calculator:reset', { id: 'concrete-slab-pro' });
  });

  element.querySelector('[data-export="csv"]').addEventListener('click', () => {
    if (!currentResult) return;
    const state = stateFromForm(form, form.units.value);
    downloadCSV({
      title: 'concrete-slab-pro-estimate',
      entries: buildEntries(state, currentResult)
    });
  });

  element.querySelector('[data-export="xlsx"]').addEventListener('click', () => {
    if (!currentResult) return;
    const state = stateFromForm(form, form.units.value);
    downloadXLSX({
      title: 'concrete-slab-pro-estimate',
      entries: buildEntries(state, currentResult)
    });
  });

  element.querySelector('[data-export="pdf"]').addEventListener('click', () => {
    if (!currentResult) return;
    const state = stateFromForm(form, form.units.value);
    downloadPDF({
      title: 'Concrete Slab Pro Estimate',
      subtitle: `Region: ${form.region.value}`,
      entries: buildEntries(state, currentResult),
      notes: [
        'Ready-mix concrete pricing pulled from CostFlowAI base dataset.',
        'Rebar layout assumes uniform grid and lap splices at each intersection.',
        'Labor productivity defaults to 3 yd³/hr unless overridden.'
      ]
    });
  });

  element.querySelector('[data-export="print"]').addEventListener('click', () => {
    triggerPrint();
  });

  setButtonState(calculateBtn, form, validator);
};

export const exportEstimate = (format, form, result) => {
  const entries = buildEntries(stateFromForm(form, form.units.value), result);
  switch (format) {
    case 'csv':
      downloadCSV({ title: 'concrete-slab-pro-estimate', entries });
      break;
    case 'xlsx':
      downloadXLSX({ title: 'concrete-slab-pro-estimate', entries });
      break;
    case 'pdf':
      downloadPDF({ title: 'Concrete Slab Pro Estimate', entries });
      break;
    default:
      break;
  }
};

export default {
  init,
  compute,
  explain,
  exportEstimate
};
