/**
 * Calculator Runner - Wires calculators to DOM and handles updates
 */

import { compute, getFormula } from './registry.js';
import { copyText, downloadCSV, downloadPDF } from '../utils/exports.js';

// Regional pricing options
export const REGIONS = {
  'US_DEFAULT': 'National Average',
  'NC': 'North Carolina',
  'TX': 'Texas', 
  'CA': 'California',
  'NY': 'New York',
  'FL': 'Florida',
  'Midwest': 'Midwest Region',
  'West Coast': 'West Coast'
};

/**
 * Wire a calculator to its DOM elements
 */
export function wireCalculator(calculatorKey, config) {
  const { 
    sectionSelector,
    inputSelectors,
    outputSelectors, 
    calculateButton,
    formulaContainer 
  } = config;
  
  const section = document.querySelector(sectionSelector);
  if (!section) {
    console.warn(`Section not found: ${sectionSelector}`);
    return;
  }
  
  // Find input elements
  const inputs = {};
  Object.entries(inputSelectors).forEach(([key, selector]) => {
    const element = section.querySelector(selector);
    if (element) {
      inputs[key] = element;
    } else {
      console.warn(`Input not found: ${selector} for ${key}`);
    }
  });
  
  // Find output elements
  const outputs = {};
  Object.entries(outputSelectors).forEach(([key, selector]) => {
    const element = section.querySelector(selector);
    if (element) {
      outputs[key] = element;
    } else {
      console.warn(`Output not found: ${selector} for ${key}`);
    }
  });
  
  // Read input values safely
  function readInputs() {
    const values = {};
    Object.entries(inputs).forEach(([key, element]) => {
      if (element.type === 'checkbox') {
        values[key] = element.checked;
      } else if (element.type === 'number' || element.type === 'range') {
        values[key] = parseFloat(element.value) || 0;
      } else {
        values[key] = element.value || '';
      }
    });
    return values;
  }
  
  // Update output elements
  function updateOutputs(results) {
    if (!results) return;
    
    Object.entries(outputs).forEach(([key, element]) => {
      const value = results[key];
      if (value !== undefined) {
        if (typeof value === 'number') {
          // Format numbers appropriately
          if (key.includes('Cost') || key.includes('Price') || key === 'totalCost') {
            element.textContent = `$${value.toLocaleString('en-US', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            })}`;
          } else if (key.includes('Gallons') || key === 'volume' || key === 'yards') {
            element.textContent = value.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            });
          } else {
            element.textContent = value.toLocaleString('en-US', { 
              maximumFractionDigits: 2 
            });
          }
        } else {
          element.textContent = value;
        }
      }
    });
  }
  
  // Perform calculation
  function calculate() {
    try {
      const inputValues = readInputs();
      const results = compute(calculatorKey, inputValues);
      
      if (results) {
        updateOutputs(results);
        
        // Store last calculation for exports
        window.lastCalculation = {
          type: calculatorKey,
          title: `${calculatorKey.charAt(0).toUpperCase() + calculatorKey.slice(1)} Calculator Results`,
          inputs: inputValues,
          results: results,
          timestamp: new Date().toISOString()
        };
        
        // Enable export buttons
        enableExportButtons(section);
        
        // Show formula if container exists
        if (formulaContainer) {
          displayFormula(calculatorKey, formulaContainer);
        }
        
        // Dispatch calculation complete event
        section.dispatchEvent(new CustomEvent('calculationComplete', {
          detail: { calculator: calculatorKey, results }
        }));
        
        console.log(`${calculatorKey} calculation completed:`, results);
      } else {
        console.error(`Calculation failed for ${calculatorKey}`);
      }
    } catch (error) {
      console.error(`Error in ${calculatorKey} calculation:`, error);
    }
  }
  
  // Bind events
  Object.values(inputs).forEach(input => {
    ['input', 'change'].forEach(event => {
      input.addEventListener(event, calculate);
    });
  });
  
  // Bind calculate button
  const button = section.querySelector(calculateButton);
  if (button) {
    button.addEventListener('click', calculate);
  }
  
  // Bind export buttons
  bindExportButtons(section);
  
  // Initial calculation
  calculate();
  
  return {
    section,
    inputs,
    outputs,
    calculate,
    readInputs,
    updateOutputs
  };
}

/**
 * Bind export button event handlers
 */
function bindExportButtons(section) {
  // Copy button
  const copyBtn = section.querySelector('[data-action="save"]');
  if (copyBtn) {
    copyBtn.addEventListener('click', copyText);
  }
  
  // CSV export button
  const csvBtn = section.querySelector('[data-action="export"]');
  if (csvBtn) {
    csvBtn.addEventListener('click', downloadCSV);
  }
  
  // PDF export button  
  const pdfBtn = section.querySelector('[data-action="print"]');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', downloadPDF);
  }
  
  // Email/share button (copy to clipboard)
  const shareBtn = section.querySelector('[data-action="email"], [data-action="share"]');
  if (shareBtn) {
    shareBtn.addEventListener('click', copyText);
  }
}

/**
 * Enable export buttons for a section
 */
function enableExportButtons(section) {
  const buttons = section.querySelectorAll('[data-action="save"], [data-action="export"], [data-action="share"], [data-action="print"], [data-action="email"]');
  buttons.forEach(btn => {
    btn.disabled = false;
    btn.style.opacity = '1';
  });
}

/**
 * Display formula transparency information
 */
function displayFormula(calculatorKey, container) {
  const formula = getFormula(calculatorKey);
  if (!formula) return;
  
  const formulaHtml = `
    <div class="formula-panel">
      <h4>🧮 ${formula.title}</h4>
      <div class="formula-expressions">
        ${formula.expressions.map(expr => `<div class="formula-expr">${expr}</div>`).join('')}
      </div>
      <div class="formula-notes">
        <strong>Notes:</strong>
        <ul>
          ${formula.notes.map(note => `<li>${note}</li>`).join('')}
        </ul>
      </div>
      <div class="formula-methodology">
        <strong>Methodology:</strong> ${formula.methodology}
      </div>
    </div>
  `;
  
  container.innerHTML = formulaHtml;
}

/**
 * Add regional pricing selector to a calculator
 */
export function addRegionalPricing(section, onRegionChange) {
  const regionSelector = section.querySelector('#region-selector');
  if (!regionSelector) {
    console.warn('Regional pricing selector not found');
    return;
  }
  
  // Populate options
  Object.entries(REGIONS).forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    if (value === 'US_DEFAULT') option.selected = true;
    regionSelector.appendChild(option);
  });
  
  // Bind change event
  regionSelector.addEventListener('change', () => {
    if (onRegionChange) {
      onRegionChange(regionSelector.value);
    }
  });
}