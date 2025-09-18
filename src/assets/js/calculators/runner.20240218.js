import { compute, explain, getCalculator } from './registry.20240218.js';
import { downloadCSV, downloadPDF, triggerPrint, copySummary } from '../core/export.20240218.js';
import { announce, focusErrorSummary } from '../core/a11y.20240218.js';
import { recordTelemetry } from '../core/telemetry.20240218.js';
import { publish } from '../core/calcBus.20240218.js';

const STORAGE_KEY = 'costflowai.prefs';

function loadPrefs() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (error) {
    console.debug('Unable to load prefs', error);
    return {};
  }
}

function savePrefs(prefs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.debug('Unable to persist prefs', error);
  }
}

const prefs = loadPrefs();

function resolveRegionOverride() {
  if (typeof window === 'undefined') return prefs.region || 'US_DEFAULT';
  const params = new URLSearchParams(window.location.search);
  if (params.has('region')) {
    const region = params.get('region');
    prefs.region = region;
    savePrefs(prefs);
    return region;
  }
  return prefs.region || 'US_DEFAULT';
}

function createErrorSummary(section) {
  let summary = section.querySelector('[data-error-summary]');
  if (!summary) {
    summary = document.createElement('div');
    summary.setAttribute('data-error-summary', 'true');
    summary.setAttribute('role', 'alert');
    summary.className = 'calc-error-summary';
    summary.hidden = true;
    section.prepend(summary);
  }
  return summary;
}

function renderErrors(section, inputs, errors) {
  const summary = createErrorSummary(section);
  if (!errors || Object.keys(errors).length === 0) {
    summary.hidden = true;
    summary.innerHTML = '';
    Object.values(inputs).forEach(input => {
      const field = input.closest('.input-group') || input.parentElement;
      field?.classList.remove('has-error');
      const message = field?.querySelector('.input-error');
      if (message) message.remove();
    });
    return;
  }

  const messages = Object.entries(errors).map(([key, message]) => `<li><strong>${key}</strong>: ${message}</li>`);
  summary.innerHTML = `<h4>We need a quick fix:</h4><ul>${messages.join('')}</ul>`;
  summary.hidden = false;
  focusErrorSummary(summary);

  Object.entries(inputs).forEach(([key, input]) => {
    const field = input.closest('.input-group') || input.parentElement;
    if (!field) return;
    const message = errors[key];
    field.classList.toggle('has-error', Boolean(message));
    let inline = field.querySelector('.input-error');
    if (message) {
      if (!inline) {
        inline = document.createElement('div');
        inline.className = 'input-error';
        inline.setAttribute('role', 'status');
        field.appendChild(inline);
      }
      inline.textContent = message;
    } else if (inline) {
      inline.remove();
    }
  });
}

function ensureMathToggle(section, calculatorKey) {
  let toggle = section.querySelector('[data-action="show-math"]');
  let panel = section.querySelector('[data-formula-panel]');
  if (!panel) {
    panel = document.createElement('div');
    panel.setAttribute('data-formula-panel', 'true');
    panel.className = 'formula-panel collapse';
    panel.hidden = true;
    section.querySelector('.results-section')?.appendChild(panel);
  }
  if (!toggle) {
    toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.setAttribute('data-action', 'show-math');
    toggle.className = 'btn btn-secondary';
    toggle.textContent = 'Show math';
    section.querySelector('.results-section .actions')?.appendChild(toggle);
  }
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.textContent = expanded ? 'Show math' : 'Hide math';
    panel.hidden = expanded;
  });
  toggle.dataset.calculator = calculatorKey;
  return panel;
}

function enableExports(section, calculation) {
  const csvBtn = section.querySelector('[data-action="export"]');
  const pdfBtn = section.querySelector('[data-action="pdf"]');
  const printBtn = section.querySelector('[data-action="print"]');
  const copyBtn = section.querySelector('[data-action="copy"]');
  [csvBtn, pdfBtn, printBtn, copyBtn].forEach(button => {
    if (!button) return;
    button.disabled = false;
    button.classList.remove('is-disabled');
  });
  csvBtn?.addEventListener('click', () => downloadCSV(calculation), { once: true });
  pdfBtn?.addEventListener('click', () => downloadPDF(calculation), { once: true });
  printBtn?.addEventListener('click', () => triggerPrint(calculation), { once: true });
  copyBtn?.addEventListener('click', () => copySummary(calculation), { once: true });
}

function readInputs(inputElements) {
  const values = {};
  Object.entries(inputElements).forEach(([key, element]) => {
    if (element.type === 'checkbox') {
      values[key] = element.checked;
    } else if (element.type === 'number' || element.type === 'range') {
      values[key] = element.value ? Number(element.value) : '';
    } else {
      values[key] = element.value;
    }
  });
  return values;
}

function ensureButtonState(button, inputElements) {
  function update() {
    const values = readInputs(inputElements);
    const hasValues = Object.values(values).some(value => value !== '' && value !== null && !Number.isNaN(value));
    button.disabled = !hasValues;
    button.classList.toggle('is-disabled', button.disabled);
  }
  Object.values(inputElements).forEach(input => {
    input.addEventListener('input', update);
    input.addEventListener('change', update);
  });
  update();
}

export function wireCalculator(calculatorKey, config) {
  const section = document.querySelector(config.sectionSelector);
  if (!section) return null;
  const calculator = getCalculator(calculatorKey);
  if (!calculator) return null;

  const inputElements = {};
  Object.entries(config.inputSelectors).forEach(([key, selector]) => {
    const el = section.querySelector(selector);
    if (el) {
      inputElements[key] = el;
      if (prefs[key] != null) {
        if (el.type === 'checkbox') {
          el.checked = Boolean(prefs[key]);
        } else {
          el.value = prefs[key];
        }
      }
    }
  });

  const outputElements = {};
  Object.entries(config.outputSelectors).forEach(([key, selector]) => {
    const el = section.querySelector(selector);
    if (el) outputElements[key] = el;
  });

  const calculateButton = section.querySelector(config.calculateButton);
  if (!calculateButton) return null;

  ensureButtonState(calculateButton, inputElements);

  const regionSelect = inputElements.region || section.querySelector('#region-selector');
  const defaultRegion = resolveRegionOverride();
  if (regionSelect && defaultRegion) {
    regionSelect.value = defaultRegion;
  }

  const formulaPanel = ensureMathToggle(section, calculatorKey);
  const errorSummary = createErrorSummary(section);

  calculateButton.addEventListener('click', event => {
    event.preventDefault();
    const values = readInputs(inputElements);
    if (regionSelect) {
      prefs.region = regionSelect.value;
      savePrefs(prefs);
    }

    const calcResult = compute(calculatorKey, values);
    if (!calcResult) {
      announce('Calculation failed');
      return;
    }
    if (calcResult.errors) {
      renderErrors(section, inputElements, calcResult.errors);
      return;
    }

    renderErrors(section, inputElements, null);

    const { results } = calcResult;
    Object.entries(results).forEach(([key, value]) => {
      const output = outputElements[key];
      if (!output) return;
      if (typeof value === 'number') {
        output.textContent = key.toLowerCase().includes('cost') || key === 'totalCost'
          ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
      } else {
        output.textContent = value;
      }
    });

    const summaryEl = section.querySelector('[data-result-summary]');
    if (summaryEl) summaryEl.textContent = calcResult.summary;

    if (formulaPanel) {
      const markdown = explain(calculatorKey, calcResult);
      formulaPanel.innerText = markdown;
    }

    const calculationPayload = {
      type: calculatorKey,
      title: `${calculatorKey} calculator results`,
      inputs: calcResult.inputs,
      results: calcResult.results,
      timestamp: new Date().toISOString()
    };
    enableExports(section, calculationPayload);

    recordTelemetry('calculator_compute', {
      calculator: calculatorKey,
      fields_count: Object.keys(values).length,
      compute_ms: 0
    });
    publish('calculator:computed', {
      calculator: calculatorKey,
      results: calcResult.results
    });

    announce('Calculation updated');
    errorSummary.hidden = true;
  });

  if (regionSelect) {
    regionSelect.addEventListener('change', () => {
      prefs.region = regionSelect.value;
      savePrefs(prefs);
    });
  }

  return {
    section,
    calculateButton,
    inputElements,
    outputElements
  };
}

export function addRegionalPricing(section, onChange) {
  const regionSelector = section.querySelector('#region-selector');
  if (!regionSelector) return;
  const regions = [
    { value: 'US_DEFAULT', label: 'National Average' },
    { value: 'nc', label: 'North Carolina' },
    { value: 'tx', label: 'Texas' },
    { value: 'ca', label: 'California' },
    { value: 'ny', label: 'New York' },
    { value: 'fl', label: 'Florida' },
    { value: 'midwest', label: 'Midwest' },
    { value: 'west-coast', label: 'West Coast' }
  ];
  if (!regionSelector.options.length) {
    regions.forEach(({ value, label }) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      regionSelector.appendChild(option);
    });
  }
  regionSelector.value = resolveRegionOverride();
  regionSelector.addEventListener('change', () => onChange?.(regionSelector.value));
}
