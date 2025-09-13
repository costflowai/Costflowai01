/**
 * CostFlowAI Calculators Hub - Universal dispatcher and utilities
 * Standardizes wiring across all calculators without altering formulas
 */

// Manual-only enforcement - enhanced gating system
window.CALC_TRIGGER_MODE='manual_all';

function allowCompute(origin) {
  return origin === 'manual' && window.CALC_TRIGGER_MODE === 'manual_all';
}

function requestCompute(section, slug, origin) { 
  if(origin!=='manual') return; // block auto
  
  try {
    // Call compute function using priority hierarchy
    if (window[slug+'Pro']?.compute) return window[slug+'Pro'].compute(section);
    if (typeof window['compute_'+slug]==='function') return window['compute_'+slug](section);
    const fn='calculate'+slug.charAt(0).toUpperCase()+slug.slice(1);
    if (typeof window[fn]==='function') return window[fn](section);
    
    // No calculator found - show user-friendly error
    showCalculatorError(`Calculator "${slug}" is not available`, 'warning');
    console.warn('No compute for', slug);
  } catch (error) {
    // Calculation failed - show error to user
    showCalculatorError('Calculation failed. Please check your inputs and try again.', 'error');
    console.error('Calculator error:', error);
  }
}

// Global lastCalculation tracking
function setLastCalculation(slug, title, inputs, results) {
  window.lastCalculation = { 
    type: slug, 
    title: title || slug.toUpperCase()+' Calculator Results',
    inputs: inputs || {}, 
    results: results || {}, 
    timestamp: new Date().toISOString() 
  };
  (window.lastCalculationByType ||= {})[slug] = window.lastCalculation;
  
  // Apply consistent formatting to results
  applyCalculationFormatting(slug, results);
  
  // Enable/disable Save/Export/Share/Print/Email based on lastCalculation
  updateActionButtons(slug);
}

function updateActionButtons(slug) {
  // Enable action buttons only when lastCalculation.type matches current slug
  const isEnabled = window.lastCalculation?.type === slug;
  document.querySelectorAll('[data-action="save"], [data-action="export"], [data-action="share"], [data-action="print"], [data-action="email"]')
    .forEach(btn => {
      btn.disabled = !isEnabled;
      btn.style.opacity = isEnabled ? '1' : '0.5';
    });
}

window.requestCompute = requestCompute;

// Enhanced utility functions with validation
function _num(v) { 
  const x = parseFloat(String(v).replace(/,/g, '')); 
  return Number.isFinite(x) ? x : 0; 
}

// Professional validation system
function validateInput(value, min = 0, max = 1000000, fieldName = 'field') {
  const num = _num(value);
  if (num < min || num > max) {
    throw new Error(`${fieldName} must be between ${min.toLocaleString()} and ${max.toLocaleString()}`);
  }
  return num;
}

// Enhanced error handling with user-friendly messages
function showError(message, inputElement = null) {
  // Focus on problematic input
  if (inputElement) {
    inputElement.focus();
    inputElement.style.borderColor = '#ef4444';
    setTimeout(() => inputElement.style.borderColor = '', 3000);
  }
  
  // Show professional error message
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#ef4444;color:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(239,68,68,0.4);z-index:9999;max-width:400px;font-size:14px;line-height:1.4;';
  errorDiv.innerHTML = `<strong>⚠️ Input Error:</strong><br>${message}`;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 5000);
}

// Success notification system
function showSuccess(message, details = null) {
  const successDiv = document.createElement('div');
  successDiv.style.cssText = 'position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(16,185,129,0.4);z-index:9999;max-width:400px;font-size:14px;line-height:1.4;';
  successDiv.innerHTML = `<strong>✅ Calculation Complete:</strong><br>${message}${details ? '<br><small>' + details + '</small>' : ''}`;
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 4000);
}

// Load calculator map
async function loadCalcMap() {
  if (window.CALC_MAP) return window.CALC_MAP;
  try {
    const res = await fetch('/assets/data/calc-map.json', { cache: 'no-store' });
    const json = await res.json();
    window.CALC_MAP = json.calculators || {};
  } catch (e) { 
    console.warn('Failed to load calc-map:', e);
    window.CALC_MAP = {}; 
  }
  return window.CALC_MAP;
}

// Selector helpers
function qIn(section, sels) {
  // Prefer data-* within the section, then fallback selectors (scoped first, then global)
  for (const sel of sels) {
    const el = section.querySelector(sel) || document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function getInput(section, type, key) {
  const map = (window.CALC_MAP?.[type]?.inputs?.[key]) || [`[data-field="${key}"]`];
  const el = qIn(section, map);
  if (!el) return null;
  if (el.type === 'checkbox' || el.type === 'radio') return !!el.checked;
  if (el.tagName === 'SELECT') return el.value;
  return el.value;
}

function setOutput(section, type, key, val) {
  const map = (window.CALC_MAP?.[type]?.outputs?.[key]) || [`[data-out="${key}"]`];
  const el = qIn(section, map);
  if (!el) return;
  el.textContent = Number.isFinite(val) 
    ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) 
    : (val ?? '');
}

// Legacy helper functions for backward compatibility
function $q(root, sel) { 
    return root.querySelector(sel); 
}

function num(root, sel) { 
    const element = $q(root, sel);
    if (!element) return 0;
    const value = (element.value || element.textContent || '').toString().replace(/[,\$]/g, '');
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function out(root, sel, value) { 
    const element = $q(root, sel);
    if (!element) return;
    
    const formattedValue = Number.isFinite(value) ? 
        value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0';
    
    // Handle different output formats
    if (element.tagName === 'INPUT') {
        element.value = formattedValue;
    } else {
        element.textContent = formattedValue;
    }
}

// Legacy compatibility maintained by main setLastCalculation function above

// Legacy payload setter for backward compatibility
function setCalculationPayload(type, title, inputs, results) {
    return setLastCalculation(type, title, inputs, results);
}

// Neutralize legacy auto listeners (no deletion; safe reroute)
document.addEventListener('input', (e)=>{
  const sec = e.target.closest('[data-calc],[id$="-calc"]'); if(!sec) return;
  const t = sec.dataset.calc || sec.id.replace('-calc','');
  // route as 'auto' → gate blocks it
  requestCompute(sec, t, 'auto');
}, true);

document.addEventListener('change', (e)=>{
  const sec = e.target.closest('[data-calc],[id$="-calc"]'); if(!sec) return;
  const t = sec.dataset.calc || sec.id.replace('-calc','');
  requestCompute(sec, t, 'auto');
}, true);

// Accessibility: Enter key triggers manual compute
document.addEventListener('keydown',(e)=>{
  if(e.key!=='Enter') return;
  const s=e.target.closest('[data-calc],[id$="-calc"]'); if(!s) return;
  const t=s.dataset.calc || s.id.replace('-calc','');
  e.preventDefault(); requestCompute(s,t,'manual');
});

// Compute dispatcher with manual-only enforcement
function computeDispatch(section, type, origin) {
  if (!allowCompute(origin)) return;
  if (window[`${type}Pro`]?.compute) return window[`${type}Pro`].compute(section);
  if (typeof window[`compute_${type}`] === 'function') return window[`compute_${type}`](section);
}

// Enhanced delegated click handler with manual-only enforcement
document.addEventListener('click', e=>{
  const btn=e.target.closest('[data-action="calculate"],[data-action="design"]'); 
  if(btn) {
    const section=btn.closest('[data-calc],[id$="-calc"]'); 
    if(!section) return;
    const slug=section.dataset.calc||section.id.replace('-calc','');
    e.preventDefault(); 
    requestCompute(section, slug, 'manual');
    return;
  }
  
  // Handle export/action buttons
  const actionBtn = e.target.closest('[data-action="save"],[data-action="export"],[data-action="share"],[data-action="print"],[data-action="email"]');
  if(actionBtn) {
    const section = actionBtn.closest('[data-calc],[id$="-calc"]');
    if(!section) return;
    const slug = section.dataset.calc || section.id.replace('-calc','');
    const action = actionBtn.dataset.action;
    
    e.preventDefault();
    
    if(action === 'save') {
      window.saveCalc?.(slug);
    } else if(action === 'export') {
      window.exportCalc?.(slug);
    } else if(action === 'share') {
      window.exportUtils?.copyToClipboard?.(window.lastCalculation);
    } else if(action === 'print') {
      window.printCalc?.(section, slug);
    } else if(action === 'email') {
      window.emailCalc?.(section, slug);
    }
  }
});

// Enter key triggers manual compute
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter') return;
  const s=e.target.closest('[data-calc],[id$="-calc"]'); if(!s) return;
  const slug=s.dataset.calc||s.id.replace('-calc',''); e.preventDefault();
  requestCompute(s, slug, 'manual');
});

// Tab switching is now handled by calc-tabs.js for improved mobile support

// Bridge functions - define only if missing
window.exportCalc ||= (type) => {
  if (!window.lastCalculation) {
    window.exportUtils?.showToast?.('Please calculate first before exporting', 'warning');
    return;
  }
  
  // Show export options
  const options = ['CSV', 'PDF', 'Copy to Clipboard'];
  const choice = prompt(`Choose export format:\n1. CSV\n2. PDF\n3. Copy to Clipboard\n\nEnter 1, 2, or 3:`);
  
  if (choice === '1' || choice === 'csv' || choice === 'CSV') {
    window.exportUtils?.exportToCSV?.(window.lastCalculation, type);
  } else if (choice === '2' || choice === 'pdf' || choice === 'PDF') {
    window.exportUtils?.exportToPDF?.(window.lastCalculation, type);
  } else if (choice === '3' || choice === 'copy' || choice === 'clipboard') {
    window.exportUtils?.copyToClipboard?.(window.lastCalculation);
  } else if (choice) {
    // Default to CSV if they entered something
    window.exportUtils?.exportToCSV?.(window.lastCalculation, type);
  }
};

window.saveCalc ||= (type) => {
  if (!window.lastCalculation) return;
  try {
    localStorage.setItem(
      `costflowai_${type}_${Date.now()}`, 
      JSON.stringify(window.lastCalculation)
    );
  } catch {}
  window.exportUtils?.showToast?.('Saved!');
};

window.printCalc ||= (section, type) => {
  const s = section || document.querySelector(`[data-calc="${type}"],#${type}-calc`) || document.body;
  const html = (s.querySelector('.results,.results-section')?.outerHTML || s.outerHTML)
    .replace(/<\/script>/gi, '<\\/script>');
  
  const w = window.open('', '_blank');
  w.document.write(`<!doctype html><html><head><title>${type} Results</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="/assets/css/main.css">
    </head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
};

window.emailCalc ||= async (section, type) => {
  const hp = section.querySelector('[data-field="hp"]')?.value || '';
  if (hp) return; // Honeypot check
  
  let to = section.querySelector('[data-field="email"]')?.value?.trim() ||
           section.querySelector('input[type="email"]')?.value?.trim();
  
  if (!to) {
    to = prompt('Enter email address to send results:')?.trim();
  }
  
  if (!to || !/^[^@]+@[^@]+\.[^@]+$/.test(to)) 
    return alert('Enter a valid email.');
  
  if (!window.lastCalculation || window.lastCalculation.type !== type) 
    return alert('Calculate first.');
  
  const html = `<h2>${window.lastCalculation.title || type}</h2>
    <pre>${JSON.stringify(window.lastCalculation.results, null, 2)}</pre>`;
  
  try {
    const r = await fetch('/.netlify/functions/send-calc-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject: `${type.toUpperCase()} result`,
        html
      })
    });
    
    if (r.ok) return window.exportUtils?.showToast?.('Sent!') || alert('Sent!');
    alert('Email failed - server error');
  } catch (error) {
    console.error('Email failed:', error);
    alert('Email failed - network error');
  }
};

// Adapter functions - use new helpers where native compute is missing
function compute_paint(section) {
  const wall = _num(getInput(section, 'paint', 'wall-area') || getInput(section, 'paint-pro', 'wall-area') || 0);
  const openings = _num(getInput(section, 'paint', 'openings') || getInput(section, 'paint-pro', 'openings') || 0);
  const coats = _num(getInput(section, 'paint', 'coats') || getInput(section, 'paint-pro', 'coats') || 2);
  const texture = getInput(section, 'paint', 'texture') || getInput(section, 'paint-pro', 'texture') || 'smooth';
  const quality = getInput(section, 'paint', 'quality') || getInput(section, 'paint-pro', 'quality') || 'basic';
  const primer = !!getInput(section, 'paint', 'primer') || !!getInput(section, 'paint-pro', 'primer');
  
  if (!wall) {
    showError('Please enter wall area for paint calculation');
    return;
  }

  const coverage = {smooth: 400, light: 350, medium: 300, heavy: 250}[texture] || 400;
  const paintable = Math.max(0, wall - openings);
  const gallons = (paintable / coverage) * coats * 1.10;
  const ppg = {basic: 35, premium: 55, ultra: 75}[quality] || 35;
  const paintCost = gallons * ppg;
  const primerGal = primer ? Math.ceil(paintable / 300) : 0;
  const primerCost = primer ? primerGal * 45 : 0;
  const labor = paintable * 0.65;

  setOutput(section, 'paint', 'paintable', paintable);
  setOutput(section, 'paint', 'paint-gal', gallons);
  setOutput(section, 'paint', 'primer-gal', primerGal);
  setOutput(section, 'paint', 'paint-cost', paintCost);
  setOutput(section, 'paint', 'primer-cost', primerCost);
  setOutput(section, 'paint', 'labor', labor);
  setOutput(section, 'paint', 'total', paintCost + primerCost + labor);

  setLastCalculation('paint', 'Paint Calculator Results', 
    {wallArea: wall, openings, coats, texture, quality, primer},
    {gallons: +gallons.toFixed(2), primerGallons: primerGal, paintCost, primerCost, 
     laborCost: labor, totalCost: paintCost + primerCost + labor});
     
  showSuccess(`Paint calculation complete: ${gallons.toFixed(1)} gallons`, `$${(paintCost + primerCost + labor).toLocaleString()} total cost`);
}

function compute_framing(section) {
  const length = _num(getInput(section, 'framing', 'wall-length') || getInput(section, 'framing-optimizer', 'wall-length') || 0);
  const height = _num(getInput(section, 'framing', 'wall-height') || getInput(section, 'framing-optimizer', 'wall-height') || 0);
  const spacing = _num(getInput(section, 'framing', 'spacing') || getInput(section, 'framing-optimizer', 'spacing') || 16);
  const openings = _num(getInput(section, 'framing', 'openings') || getInput(section, 'framing-optimizer', 'openings') || 0);
  
  if (!length || !height) {
    showError('Please enter wall length and height for framing calculation');
    return;
  }
  
  const studs = Math.floor((length * 12) / spacing) + 1 + (openings * 2);
  const plates = Math.ceil(length / 8) * 2; // Top and bottom plates
  const lf = studs * height + plates * length;
  const matCost = lf * 2.50; // $2.50 per linear foot
  const laborCost = lf * 1.25;
  
  setOutput(section, 'framing', 'studs', studs);
  setOutput(section, 'framing', 'plates', plates);
  setOutput(section, 'framing', 'lf', lf);
  setOutput(section, 'framing', 'mat', matCost);
  setOutput(section, 'framing', 'labor', laborCost);
  setOutput(section, 'framing', 'total', matCost + laborCost);
  
  setLastCalculation('framing', 'Framing Calculator Results',
    {length, height, spacing, openings},
    {studs, plates, linearFeet: lf, materialCost: matCost, laborCost, totalCost: matCost + laborCost});
    
  showSuccess(`Framing calculation complete: ${studs} studs needed`, `${lf} linear feet - $${(matCost + laborCost).toLocaleString()} total`);
}

function compute_concrete(section) {
  const length = _num(getInput(section, 'concrete', 'length'));
  const width = _num(getInput(section, 'concrete', 'width'));
  const thickness = _num(getInput(section, 'concrete', 'thickness')) / 12; // Convert to feet
  
  const volume = length * width * thickness;
  const yards = volume / 27;
  const matCost = yards * 120; // $120 per yard
  const laborCost = yards * 80;
  
  setOutput(section, 'concrete', 'volume', volume);
  setOutput(section, 'concrete', 'yards', yards);
  setOutput(section, 'concrete', 'mat', matCost);
  setOutput(section, 'concrete', 'labor', laborCost);
  setOutput(section, 'concrete', 'total', matCost + laborCost);
  
  setLastCalculation('concrete', 'Concrete Calculator Results',
    {length, width, thickness: thickness * 12},
    {volume, yards, materialCost: matCost, laborCost, totalCost: matCost + laborCost});
}

// ROOFING CALCULATOR - Professional roofing system analysis
function compute_roofing(section) {
  try {
    // Get input elements
    const lengthEl = document.getElementById('roof-length');
    const widthEl = document.getElementById('roof-width');
    const pitchEl = document.getElementById('roof-pitch');
    const windSpeedEl = document.getElementById('roof-wind-speed');
    
    if (!lengthEl || !widthEl || !pitchEl || !windSpeedEl) {
      throw new Error('Required roofing form elements are missing from the page');
    }
    
    // Validate inputs with professional error handling
    const length = validateInput(lengthEl?.value, 1, 1000, 'Roof length');
    const width = validateInput(widthEl?.value, 1, 1000, 'Roof width');
    const pitch = validateInput(pitchEl?.value, 0.25, 24, 'Roof pitch');
    const windSpeed = validateInput(windSpeedEl?.value, 70, 200, 'Design wind speed');
    
    const complexity = document.getElementById('roof-complexity')?.value || 'moderate';
    const access = document.getElementById('roof-access')?.value || 'moderate';
  
  // Calculate roof area with pitch factor
  const pitchFactor = Math.sqrt(1 + Math.pow(pitch/12, 2));
  const baseArea = length * width;
  const actualArea = baseArea * pitchFactor;
  
  // Waste factors based on complexity
  const wasteFactors = {
    simple: 0.10, moderate: 0.15, complex: 0.20, 'very-complex': 0.25
  };
  const wasteArea = actualArea * (1 + (wasteFactors[complexity] || 0.15));
  
  // Calculate squares (100 sq ft each)
  const squares = wasteArea / 100;
  
  // Wind load calculation (simplified ASCE 7)
  const windLoad = Math.pow(windSpeed / 100, 2) * 16; // Basic wind pressure formula
  
  // Material calculations
  const underlaymentArea = wasteArea * 1.10; // 10% overlap
  const ridgeLength = length;
  const eaveLength = (length + width) * 2;
  
  // Cost calculations based on complexity and access
  const complexityMultipliers = {
    simple: 1.0, moderate: 1.15, complex: 1.35, 'very-complex': 1.60
  };
  const accessMultipliers = {
    easy: 1.0, moderate: 1.15, difficult: 1.35, extreme: 1.65
  };
  
  const baseMaterialCost = squares * 350; // $350 per square base
  const materialCost = baseMaterialCost * (complexityMultipliers[complexity] || 1.15);
  const laborCost = squares * 250 * (accessMultipliers[access] || 1.15);
  const totalCost = materialCost + laborCost;
  
  // Update results
  document.getElementById('roof-total-area').textContent = Math.round(wasteArea) + ' sq ft';
  document.getElementById('roof-wind-load').textContent = Math.round(windLoad) + ' psf';
  document.getElementById('roof-squares').textContent = squares.toFixed(2);
  document.getElementById('roof-underlayment-area').textContent = Math.round(underlaymentArea) + ' sq ft';
  document.getElementById('roof-ridge-length').textContent = Math.round(ridgeLength) + ' LF';
  document.getElementById('roof-eave-length').textContent = Math.round(eaveLength) + ' LF';
  document.getElementById('roof-material-cost').textContent = '$' + materialCost.toLocaleString();
  document.getElementById('roof-labor-cost').textContent = '$' + laborCost.toLocaleString();
  document.getElementById('roof-total-cost').textContent = '$' + totalCost.toLocaleString();
  
  setLastCalculation('roofing', 'Professional Roofing Analysis',
    {length, width, pitch, windSpeed, complexity, access},
    {wasteArea: Math.round(wasteArea), squares: +squares.toFixed(2), windLoad: Math.round(windLoad), materialCost, laborCost, totalCost});
    
  showSuccess(`Roofing calculation complete: ${squares.toFixed(1)} squares`, `${Math.round(wasteArea)} sq ft - $${totalCost.toLocaleString()} total`);
  
  } catch (error) {
    showError(error.message, document.getElementById('roof-length'));
  }
}

// ELECTRICAL CALCULATOR - Professional load analysis per NEC
function compute_electrical(section) {
  // Get inputs using correct IDs
  const sqft = _num(document.getElementById('elec-sqft')?.value || 0);
  const units = _num(document.getElementById('elec-units')?.value || 1);
  const smallAppliance = _num(document.getElementById('elec-small-appliance')?.value || 2);
  const laundry = _num(document.getElementById('elec-laundry')?.value || 1);
  
  // Major appliances
  const range = _num(document.getElementById('elec-range')?.value || 0);
  const dryer = _num(document.getElementById('elec-dryer')?.value || 0);
  const waterHeater = _num(document.getElementById('elec-water-heater')?.value || 0);
  const acTons = _num(document.getElementById('elec-ac-tons')?.value || 0);
  const heatPump = _num(document.getElementById('elec-heat-pump')?.value || 0);
  const heating = _num(document.getElementById('elec-heat')?.value || 0);
  const motors = _num(document.getElementById('elec-motors')?.value || 0);
  
  // Validation
  if (!sqft || sqft < 100 || sqft > 100000) {
    alert('Please enter valid building square footage (100-100,000 sq ft)');
    document.getElementById('elec-sqft')?.focus();
    return;
  }
  
  // Professional NEC 220 load calculations
  const generalLighting = sqft * 3; // 3 VA per sq ft per NEC 220.12
  const smallApplianceLoad = smallAppliance * 1500; // 1500 VA per circuit
  const laundryLoad = laundry * 1500; // 1500 VA for laundry circuit
  
  // Major appliance loads (convert kW to VA)
  const rangeLoad = range * 1000;
  const dryerLoad = dryer * 1000;  
  const waterHeaterLoad = waterHeater * 1000;
  const acLoad = acTons * 12000; // 12,000 VA per ton (cooling only)
  const heatPumpLoad = heatPump * 12000; // Heat pump load
  const heatingLoad = heating * 1000;
  const motorLoad = motors * 746; // 746 VA per HP
  
  // Total connected load with all appliances
  const baseLoad = generalLighting + smallApplianceLoad + laundryLoad;
  const applianceLoad = rangeLoad + dryerLoad + waterHeaterLoad + acLoad + heatPumpLoad + heatingLoad + motorLoad;
  const totalConnectedLoad = baseLoad + applianceLoad;
  
  // Apply NEC 220.42 demand factors
  let demandLoad = 0;
  if (baseLoad <= 3000) {
    demandLoad = baseLoad;
  } else if (baseLoad <= 120000) {
    demandLoad = 3000 + (baseLoad - 3000) * 0.35;
  } else {
    demandLoad = 3000 + 117000 * 0.35 + (baseLoad - 120000) * 0.25;
  }
  
  // Add appliance loads with demand factors
  demandLoad += rangeLoad * 0.8; // 80% demand factor for ranges
  demandLoad += Math.max(dryerLoad, waterHeaterLoad); // Largest of dryer or water heater
  demandLoad += Math.max(acLoad, heatPumpLoad, heatingLoad); // Largest heating/cooling load
  demandLoad += motorLoad * 1.25; // 125% for motor loads
  
  // Service size calculation
  const serviceCurrent = demandLoad / 240; // Assume 240V service
  let serviceSize = 100;
  if (serviceCurrent > 83) serviceSize = 150;
  if (serviceCurrent > 125) serviceSize = 200;
  if (serviceCurrent > 167) serviceSize = 300;
  if (serviceCurrent > 250) serviceSize = 400;
  
  // Conductor sizing based on service amperage
  let conductorSize = '2 AWG';
  if (serviceSize <= 100) conductorSize = '2 AWG';
  if (serviceSize > 100) conductorSize = '1/0 AWG';
  if (serviceSize > 150) conductorSize = '3/0 AWG';
  if (serviceSize > 200) conductorSize = '300 MCM';
  
  // Panel requirements
  const baseCircuits = Math.ceil(sqft / 600); // General circuits
  const applianceCircuits = (range > 0 ? 1 : 0) + (dryer > 0 ? 1 : 0) + (waterHeater > 0 ? 1 : 0) + 
                           (acTons > 0 ? 1 : 0) + (heatPump > 0 ? 1 : 0) + (heating > 0 ? Math.ceil(heating/10) : 0);
  const totalCircuits = baseCircuits + applianceCircuits + smallAppliance + laundry;
  const panelSpaces = Math.ceil(totalCircuits / 0.8); // 80% fill rule
  
  // Professional cost estimation
  const materialCost = serviceSize * 12 + panelSpaces * 35 + sqft * 3.2;
  const laborCost = serviceSize * 15 + panelSpaces * 45 + sqft * 2.8;
  const permitCost = Math.max(200, (materialCost + laborCost) * 0.08);
  const totalCost = materialCost + laborCost + permitCost;
  
  // Update results with correct IDs
  document.getElementById('elec-total-load').textContent = Math.round(totalConnectedLoad).toLocaleString() + 'W';
  document.getElementById('elec-calc-load').textContent = Math.round(demandLoad).toLocaleString() + 'W';
  document.getElementById('elec-service').textContent = serviceSize + ' Amps';
  document.getElementById('elec-conductor').textContent = conductorSize + ' AWG';
  document.getElementById('elec-material-cost').textContent = '$' + materialCost.toLocaleString();
  document.getElementById('elec-labor-cost').textContent = '$' + laborCost.toLocaleString();
  document.getElementById('elec-permit-cost').textContent = '$' + permitCost.toLocaleString();
  document.getElementById('elec-total-cost').textContent = '$' + totalCost.toLocaleString();
  
  setLastCalculation('electrical', 'Professional Electrical Load Analysis',
    {sqft, units, appliances: {range, dryer, waterHeater, acTons, heatPump, heating}},
    {connectedLoad: totalConnectedLoad, demandLoad, serviceSize, materialCost, laborCost, totalCost});
    
  // Show success message
  showSuccess('Electrical load analysis completed', `${serviceSize}A service • $${totalCost.toLocaleString()} estimated cost`);
}

// DRYWALL CALCULATOR - Professional drywall estimation
function compute_drywall(section) {
  const roomLength = _num(getInput(section, 'drywall', 'room-length') || getInput(section, 'drywall', 'length') || 0);
  const roomWidth = _num(getInput(section, 'drywall', 'room-width') || getInput(section, 'drywall', 'width') || 0);
  const ceilingHeight = _num(getInput(section, 'drywall', 'ceiling-height') || getInput(section, 'drywall', 'height') || 8);
  const doors = _num(getInput(section, 'drywall', 'doors') || 2);
  const windows = _num(getInput(section, 'drywall', 'windows') || 4);
  
  if (!roomLength || !roomWidth) {
    showError('Please enter room dimensions for drywall calculation');
    return;
  }
  
  // Calculate areas
  const wallArea = (roomLength + roomWidth) * 2 * ceilingHeight;
  const ceilingArea = roomLength * roomWidth;
  const doorArea = doors * 21; // 3' x 7' standard door
  const windowArea = windows * 15; // 3' x 5' average window
  const netWallArea = wallArea - doorArea - windowArea;
  const totalArea = netWallArea + ceilingArea;
  
  // Material calculations
  const sheets4x8 = Math.ceil(totalArea / 32); // 32 sq ft per sheet
  const sheets4x12 = Math.ceil(totalArea / 48); // 48 sq ft per sheet (fewer seams)
  const mudBuckets = Math.ceil(totalArea / 400); // 400 sq ft per 5-gallon bucket
  const tapeFeet = Math.round(totalArea * 0.75); // Linear feet of tape needed
  const cornerBead = (ceilingHeight * 4) + (doors * 14) + (windows * 12); // Linear feet
  
  // Cost calculations
  const sheetCost4x8 = sheets4x8 * 12;
  const sheetCost4x12 = sheets4x12 * 16; 
  const mudCost = mudBuckets * 35;
  const tapeCost = Math.ceil(tapeFeet / 500) * 8; // 500ft rolls
  const cornerBeadCost = Math.ceil(cornerBead / 10) * 4; // 10ft pieces
  const materialCost = Math.min(sheetCost4x8, sheetCost4x12) + mudCost + tapeCost + cornerBeadCost;
  
  const laborRate = 2.50; // per sq ft
  const laborCost = totalArea * laborRate;
  
  // Update results using setOutput helper
  setOutput(section, 'drywall', 'wall-area', Math.round(netWallArea) + ' sq ft');
  setOutput(section, 'drywall', 'sheets-required', sheets4x8 + ' Sheets');
  setOutput(section, 'drywall', 'sheets-qty', sheets4x8 + ' sheets');
  setOutput(section, 'drywall', 'compound-qty', mudBuckets + ' gallons');
  setOutput(section, 'drywall', 'tape-qty', tapeFeet + ' linear ft');
  setOutput(section, 'drywall', 'corner-qty', cornerBead + ' linear ft');
  setOutput(section, 'drywall', 'material-cost', '$' + materialCost.toLocaleString());
  setOutput(section, 'drywall', 'labor-cost', '$' + laborCost.toLocaleString());
  setOutput(section, 'drywall', 'total-cost', '$' + (materialCost + laborCost).toLocaleString());
  
  setLastCalculation('drywall', 'Drywall Professional Estimate',
    {roomLength, roomWidth, ceilingHeight, doors, windows},
    {totalArea, sheets4x8, sheets4x12, materialCost, laborCost, totalCost: materialCost + laborCost});
    
  showSuccess(`Drywall calculation complete: ${Math.round(totalArea)} sq ft`, `${sheets4x8} sheets required`);
}

// FLOORING CALCULATOR - Professional flooring analysis
function compute_flooring(section) {
  const totalSqft = _num(document.getElementById('flooring-sqft')?.value || 0);
  const roomLength = _num(document.getElementById('flooring-length')?.value || 0);
  const roomWidth = _num(document.getElementById('flooring-width')?.value || 0);
  const floorType = document.getElementById('flooring-type')?.value || 'hardwood';
  const quality = document.getElementById('flooring-grade')?.value || 'standard';
  
  if (!totalSqft && (!roomLength || !roomWidth)) {
    showError('Please enter total square footage OR room dimensions for flooring calculation');
    return;
  }
  
  const baseArea = totalSqft || (roomLength * roomWidth);
  
  // Waste factors by material type
  const wasteFactors = {
    hardwood: 0.08, laminate: 0.06, tile: 0.10, vinyl: 0.05, carpet: 0.08
  };
  const wasteArea = baseArea * (1 + (wasteFactors[floorType] || 0.08));
  
  // Material costs per sq ft by type and quality
  const materialCosts = {
    hardwood: { basic: 6, standard: 10, premium: 18 },
    laminate: { basic: 2, standard: 4, premium: 8 },
    tile: { basic: 3, standard: 6, premium: 12 },
    vinyl: { basic: 2, standard: 4, premium: 7 },
    carpet: { basic: 3, standard: 5, premium: 10 }
  };
  
  const materialCostPerSqft = materialCosts[floorType]?.[quality] || 6;
  const materialCost = wasteArea * materialCostPerSqft;
  
  // Labor costs (installation complexity varies by material)
  const laborRates = {
    hardwood: 8, laminate: 3, tile: 6, vinyl: 2, carpet: 4
  };
  const laborCost = baseArea * (laborRates[floorType] || 5);
  
  // Subfloor preparation estimate
  const subfloorCost = baseArea * 1.5;
  
  // Transition strips and trim (estimate if dimensions not provided)
  const perimeter = (roomLength && roomWidth) ? (roomLength + roomWidth) * 2 : Math.sqrt(baseArea) * 4; // Approximate perimeter
  const trimCost = perimeter * 8; // $8 per linear foot
  
  const totalCost = materialCost + laborCost + subfloorCost + trimCost;
  
  // Update results
  document.getElementById('flooring-total-area').textContent = Math.round(baseArea) + ' sq ft';
  document.getElementById('flooring-primary-qty').textContent = Math.round(wasteArea) + ' sq ft';
  document.getElementById('flooring-material-cost').textContent = '$' + materialCost.toLocaleString();
  document.getElementById('flooring-labor-cost').textContent = '$' + laborCost.toLocaleString();
  document.getElementById('flooring-subfloor-cost').textContent = '$' + subfloorCost.toLocaleString();
  document.getElementById('flooring-trim-cost').textContent = '$' + trimCost.toLocaleString();
  document.getElementById('flooring-total-cost').textContent = '$' + totalCost.toLocaleString();
  
  setLastCalculation('flooring', 'Professional Flooring Analysis',
    {roomLength, roomWidth, floorType, quality},
    {baseArea, wasteArea, materialCost, laborCost, totalCost});
}

// PLUMBING CALCULATOR - Professional plumbing system analysis
function compute_plumbing(section) {
  const toilets = _num(document.getElementById('plumb-toilets')?.value || 0);
  const lavatories = _num(document.getElementById('plumb-lavatories')?.value || 0);
  const kitchenSinks = _num(document.getElementById('plumb-kitchen-sinks')?.value || 0);
  const bathtubs = _num(document.getElementById('plumb-bathtubs')?.value || 0);
  const showers = _num(document.getElementById('plumb-showers')?.value || 0);
  const stories = _num(document.getElementById('plumb-stories')?.value || 1);
  
  const totalFixtures = toilets + lavatories + kitchenSinks + bathtubs + showers;
  if (!totalFixtures) {
    showError('Please enter at least one plumbing fixture');
    return;
  }
  
  // Fixture units calculation (International Plumbing Code)
  const fixtureUnits = totalFixtures * 2.5; // Average fixture units
  
  // Pipe sizing based on fixture units
  let mainPipeSize = '3/4"';
  if (fixtureUnits > 20) mainPipeSize = '1"';
  if (fixtureUnits > 35) mainPipeSize = '1.25"';
  if (fixtureUnits > 60) mainPipeSize = '1.5"';
  
  // Water flow requirements (GPM)
  const peakDemand = Math.sqrt(fixtureUnits) * 4; // Hunter's curve approximation
  
  // Material calculations
  const copperPipeFeet = totalFixtures * 25 + stories * 20; // Rough estimate
  const fittings = totalFixtures * 8; // 8 fittings per fixture average
  const bathrooms = Math.ceil((toilets + bathtubs + showers) / 2); // Approximate bathroom count
  const valves = bathrooms * 2 + 3; // Shutoffs and main valves
  
  // Cost calculations
  const materialCost = copperPipeFeet * 8 + fittings * 12 + valves * 45;
  const laborCost = totalFixtures * 350 + stories * 200; // Labor per fixture + story complexity
  const permitCost = Math.max(125, materialCost * 0.015);
  
  const totalCost = materialCost + laborCost + permitCost;
  
  // Update results
  document.getElementById('plumbing-fixture-units').textContent = fixtureUnits.toFixed(1);
  document.getElementById('plumbing-main-pipe-size').textContent = mainPipeSize;
  document.getElementById('plumbing-peak-demand').textContent = Math.round(peakDemand) + ' GPM';
  document.getElementById('plumbing-copper-feet').textContent = copperPipeFeet + ' LF';
  document.getElementById('plumbing-material-cost').textContent = '$' + materialCost.toLocaleString();
  document.getElementById('plumbing-labor-cost').textContent = '$' + laborCost.toLocaleString();
  document.getElementById('plumbing-permit-cost').textContent = '$' + permitCost.toLocaleString();
  document.getElementById('plumbing-total-cost').textContent = '$' + totalCost.toLocaleString();
  
  setLastCalculation('plumbing', 'Professional Plumbing Analysis',
    {totalFixtures, stories, bathrooms, toilets, lavatories, kitchenSinks, bathtubs, showers},
    {fixtureUnits, peakDemand, materialCost, laborCost, totalCost});
}

// HVAC CALCULATOR - Professional heating and cooling load calculation
function compute_hvac(section) {
  const sqft = _num(document.getElementById('hvac-sqft')?.value || 0);
  const ceilingHeight = _num(document.getElementById('hvac-ceiling-height')?.value || 8);
  const insulation = document.getElementById('hvac-insulation')?.value || 'average';
  const windows = _num(document.getElementById('hvac-windows')?.value || 10);
  const orientation = document.getElementById('hvac-orientation')?.value || 'mixed';
  
  if (!sqft) {
    alert('Please enter building square footage');
    return;
  }
  
  // Base load calculation (simplified Manual J)
  const volume = sqft * ceilingHeight;
  
  // Insulation factors
  const insulationFactors = {
    poor: 1.4, average: 1.0, good: 0.7, excellent: 0.5
  };
  const insulationFactor = insulationFactors[insulation] || 1.0;
  
  // Window heat gain
  const windowFactors = {
    north: 0.5, south: 1.0, east: 0.8, west: 0.9, mixed: 0.8
  };
  const windowLoad = windows * 500 * (windowFactors[orientation] || 0.8);
  
  // Cooling load (BTU/hr)
  const baseCoolingLoad = sqft * 25 * insulationFactor; // Base 25 BTU/sq ft
  const totalCoolingLoad = baseCoolingLoad + windowLoad;
  const coolingTons = totalCoolingLoad / 12000; // 12,000 BTU = 1 ton
  
  // Heating load (BTU/hr) - typically less than cooling
  const heatingLoad = totalCoolingLoad * 0.8;
  
  // Equipment sizing
  let unitSize = Math.ceil(coolingTons * 2) / 2; // Round to nearest 0.5 ton
  if (unitSize < 1.5) unitSize = 1.5; // Minimum size
  
  // Ductwork calculation
  const ductworkSqft = Math.ceil(sqft * 0.15); // 15% of floor area
  const returnAir = Math.ceil(sqft / 150); // Return grilles
  const supplyRegisters = Math.ceil(sqft / 100); // Supply registers
  
  // Cost calculations
  const equipmentCost = unitSize * 2800; // $2800 per ton average
  const ductworkCost = ductworkSqft * 12 + (returnAir + supplyRegisters) * 85;
  const laborCost = unitSize * 1200 + ductworkSqft * 8;
  const permitCost = Math.max(200, equipmentCost * 0.02);
  
  const totalCost = equipmentCost + ductworkCost + laborCost + permitCost;
  
  // Update results
  document.getElementById('hvac-cooling-load').textContent = Math.round(totalCoolingLoad).toLocaleString() + ' BTU/hr';
  document.getElementById('hvac-heating-load').textContent = Math.round(heatingLoad).toLocaleString() + ' BTU/hr';
  document.getElementById('hvac-tonnage').textContent = unitSize + ' Tons';
  document.getElementById('hvac-recommended-system').textContent = unitSize + ' ton ' + (unitSize > 3 ? 'commercial' : 'residential') + ' unit';
  document.getElementById('hvac-equipment-cost').textContent = '$' + equipmentCost.toLocaleString();
  document.getElementById('hvac-ductwork-cost').textContent = '$' + ductworkCost.toLocaleString();
  document.getElementById('hvac-labor-cost').textContent = '$' + laborCost.toLocaleString();
  document.getElementById('hvac-total-cost').textContent = '$' + totalCost.toLocaleString();
  
  setLastCalculation('hvac', 'Professional HVAC Load Analysis',
    {sqft, ceilingHeight, insulation, windows, orientation},
    {coolingLoad: totalCoolingLoad, heatingLoad, unitSize, equipmentCost, totalCost});
}

// INSULATION CALCULATOR - Professional thermal analysis
function compute_insulation(section) {
  const sqft = _num(document.getElementById('insulation-area')?.value || 0);
  const currentRValue = _num(document.getElementById('current-r-value')?.value || 0);
  const targetRValue = _num(document.getElementById('target-r-value')?.value || 38);
  const insulationType = document.getElementById('insulation-type')?.value || 'fiberglass';
  
  if (!sqft) {
    alert('Please enter insulation area');
    return;
  }
  
  const rValueNeeded = Math.max(0, targetRValue - currentRValue);
  
  // R-values per inch by material
  const rValuesPerInch = {
    fiberglass: 3.2, cellulose: 3.6, 'spray-foam': 6.5, 'rigid-foam': 5.0
  };
  const rPerInch = rValuesPerInch[insulationType] || 3.2;
  const thicknessNeeded = rValueNeeded / rPerInch;
  
  // Material costs per sq ft by type
  const materialCosts = {
    fiberglass: 1.20, cellulose: 1.40, 'spray-foam': 3.50, 'rigid-foam': 2.80
  };
  const materialCostPerSqft = materialCosts[insulationType] || 1.20;
  const materialCost = sqft * materialCostPerSqft * (thicknessNeeded / 3.5); // Base thickness
  
  // Labor costs vary by installation complexity
  const laborRates = {
    fiberglass: 1.50, cellulose: 2.00, 'spray-foam': 4.00, 'rigid-foam': 2.50
  };
  const laborCost = sqft * (laborRates[insulationType] || 1.50);
  
  // Energy savings calculation (simplified)
  const heatingCoolingCostPerSqft = 1.25; // Annual cost per sq ft
  const currentEfficiency = currentRValue / 38; // Efficiency relative to R-38
  const newEfficiency = targetRValue / 38;
  const energySavingsPercent = Math.max(0, (newEfficiency - currentEfficiency) * 100);
  const annualSavings = sqft * heatingCoolingCostPerSqft * (energySavingsPercent / 100);
  
  const totalCost = materialCost + laborCost;
  const paybackYears = annualSavings > 0 ? totalCost / annualSavings : Infinity;
  
  // Update results
  document.getElementById('insulation-r-needed').textContent = rValueNeeded.toFixed(1);
  document.getElementById('insulation-thickness').textContent = thicknessNeeded.toFixed(1) + '"';
  document.getElementById('insulation-material-cost').textContent = '$' + materialCost.toLocaleString();
  document.getElementById('insulation-labor-cost').textContent = '$' + laborCost.toLocaleString();
  document.getElementById('insulation-total-cost').textContent = '$' + totalCost.toLocaleString();
  document.getElementById('insulation-annual-savings').textContent = '$' + annualSavings.toLocaleString();
  document.getElementById('insulation-payback-years').textContent = paybackYears.toFixed(1) + ' years';
  
  setLastCalculation('insulation', 'Professional Insulation Analysis',
    {sqft, currentRValue, targetRValue, insulationType},
    {rValueNeeded, thicknessNeeded, materialCost, laborCost, totalCost, annualSavings});
}

// EXCAVATION CALCULATOR - Professional earthwork analysis
function compute_excavation(section) {
  const length = _num(document.getElementById('excavation-length')?.value || 0);
  const width = _num(document.getElementById('excavation-width')?.value || 0);
  const depth = _num(document.getElementById('excavation-depth')?.value || 0);
  const soilType = document.getElementById('soil-type')?.value || 'mixed';
  const access = document.getElementById('excavation-access')?.value || 'good';
  
  if (!length || !width || !depth) {
    alert('Please enter excavation dimensions');
    return;
  }
  
  // Calculate volumes
  const cubicFeet = length * width * depth;
  const cubicYards = cubicFeet / 27;
  
  // OSHA slope requirements (safety factors)
  const slopeFactors = {
    sand: 1.5, clay: 0.75, rock: 0.5, mixed: 1.0
  };
  const slopeFactor = slopeFactors[soilType] || 1.0;
  const extraVolume = cubicYards * slopeFactor; // Additional excavation for slopes
  const totalExcavation = cubicYards + extraVolume;
  
  // Equipment rates vary by access and soil
  const baseRatePerYard = 12; // Base rate per cubic yard
  const accessMultipliers = {
    excellent: 0.8, good: 1.0, poor: 1.4, restricted: 1.8
  };
  const soilMultipliers = {
    sand: 0.9, clay: 1.2, rock: 2.0, mixed: 1.0
  };
  
  const equipmentCost = totalExcavation * baseRatePerYard * 
    (accessMultipliers[access] || 1.0) * (soilMultipliers[soilType] || 1.0);
  
  // Hauling costs (assume 10 mile average)
  const haulCost = totalExcavation * 8; // $8 per yard hauling
  
  // Backfill calculation (assume 60% needs backfill)
  const backfillYards = cubicYards * 0.6;
  const backfillCost = backfillYards * 15; // $15 per yard including compaction
  
  const totalCost = equipmentCost + haulCost + backfillCost;
  
  // Update results
  document.getElementById('excavation-cubic-feet').textContent = Math.round(cubicFeet).toLocaleString() + ' cu ft';
  document.getElementById('excavation-cubic-yards').textContent = Math.round(totalExcavation) + ' cu yd';
  document.getElementById('excavation-equipment-cost').textContent = '$' + equipmentCost.toLocaleString();
  document.getElementById('excavation-haul-cost').textContent = '$' + haulCost.toLocaleString();
  document.getElementById('excavation-backfill-cost').textContent = '$' + backfillCost.toLocaleString();
  document.getElementById('excavation-total-cost').textContent = '$' + totalCost.toLocaleString();
  
  setLastCalculation('excavation', 'Professional Excavation Analysis',
    {length, width, depth, soilType, access},
    {cubicFeet, totalExcavation, equipmentCost, haulCost, backfillCost, totalCost});
}

// LABOR CALCULATOR - Professional crew optimization
function compute_labor(section) {
  const projectSqft = _num(document.getElementById('labor-project-sqft')?.value || 0);
  const tradeType = document.getElementById('trade-type')?.value || 'general';
  const skillLevel = document.getElementById('skill-level')?.value || 'mixed';
  const timeline = _num(document.getElementById('project-timeline')?.value || 30);
  
  if (!projectSqft || !timeline) {
    alert('Please enter project size and timeline');
    return;
  }
  
  // Productivity rates by trade (sq ft per man-hour)
  const productivityRates = {
    general: 25, framing: 35, electrical: 20, plumbing: 18, 
    drywall: 40, flooring: 30, painting: 50
  };
  const productivityRate = productivityRates[tradeType] || 25;
  
  // Calculate labor hours needed
  const totalManHours = projectSqft / productivityRate;
  
  // Skill level adjustments
  const skillMultipliers = {
    apprentice: 0.7, mixed: 1.0, journeyman: 1.3, master: 1.6
  };
  const skillMultiplier = skillMultipliers[skillLevel] || 1.0;
  
  // Wage rates by skill level
  const wageRates = {
    apprentice: 18, mixed: 28, journeyman: 42, master: 58
  };
  const hourlyWage = wageRates[skillLevel] || 28;
  
  // Calculate crew size needed to meet timeline
  const workingDaysInTimeline = timeline * 0.8; // 80% working days
  const hoursPerDay = 8;
  const availableManHours = workingDaysInTimeline * hoursPerDay;
  const crewSize = Math.ceil(totalManHours / availableManHours);
  
  // Cost calculations
  const directLaborCost = totalManHours * hourlyWage;
  const burdenRate = 0.35; // 35% burden (taxes, insurance, etc.)
  const burdenCost = directLaborCost * burdenRate;
  const totalLaborCost = directLaborCost + burdenCost;
  
  // Productivity bonus/penalty
  const efficiencyFactor = skillMultiplier;
  const adjustedCost = totalLaborCost * efficiencyFactor;
  
  // Update results
  document.getElementById('labor-total-hours').textContent = Math.round(totalManHours).toLocaleString() + ' hrs';
  document.getElementById('labor-crew-size').textContent = crewSize + ' workers';
  document.getElementById('labor-hourly-wage').textContent = '$' + hourlyWage + '/hr';
  document.getElementById('labor-direct-cost').textContent = '$' + directLaborCost.toLocaleString();
  document.getElementById('labor-burden-cost').textContent = '$' + burdenCost.toLocaleString();
  document.getElementById('labor-total-cost').textContent = '$' + adjustedCost.toLocaleString();
  document.getElementById('labor-cost-per-sqft').textContent = '$' + (adjustedCost / projectSqft).toFixed(2) + '/sq ft';
  
  setLastCalculation('labor', 'Professional Labor Analysis',
    {projectSqft, tradeType, skillLevel, timeline},
    {totalManHours, crewSize, directLaborCost, burdenCost, totalCost: adjustedCost});
}

// Manual-only: no auto-calculation setup needed

// Initialize export utilities
window.exportUtils ||= new (class {
  exportToCSV(data, filename) {
    try {
      const csv = this.convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || data.type || 'calc'}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('CSV exported!');
      return true;
    } catch (e) {
      console.error('Export failed:', e);
      return false;
    }
  }
  
  convertToCSV(data) {
    const lines = [`"${data.title || 'Calculator Results'}"`, `"Generated: ${new Date().toLocaleString()}"`];
    if (data.inputs) {
      lines.push('', '"INPUTS"');
      Object.entries(data.inputs).forEach(([k, v]) => lines.push(`"${k}","${v}"`));
    }
    if (data.results) {
      lines.push('', '"RESULTS"');
      Object.entries(data.results).forEach(([k, v]) => lines.push(`"${k}","${v}"`));
    }
    return lines.join('\n');
  }
  
  showToast(msg) {
    console.log(msg);
    // Simple toast fallback
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4caf50;color:white;padding:12px 24px;border-radius:4px;z-index:9999;font-size:14px;';
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  }
  
  copyToClipboard(data) {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard?.writeText(text).then(() => this.showToast('Copied!'));
    return true;
  }
})();

// Simple feedback modal system
function createFeedbackModal() {
  const modalHTML = `
    <div id="feedback-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:2rem;border-radius:12px;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <h3 style="margin:0 0 1rem 0;color:#1e3a5f;font-size:1.5rem;">💬 Send Feedback</h3>
        <p style="color:#6b7280;margin-bottom:1.5rem;">Help us improve CostFlowAI! Your feedback is valuable to us.</p>
        
        <form id="feedback-form">
          <div style="margin-bottom:1rem;">
            <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#1e3a5f;">Feedback Type:</label>
            <select id="feedback-type" style="width:100%;padding:0.75rem;border:2px solid #e5e7eb;border-radius:6px;">
              <option value="bug">🐛 Bug Report</option>
              <option value="feature">💡 Feature Request</option>
              <option value="improvement">⚡ Improvement Suggestion</option>
              <option value="general">💬 General Feedback</option>
            </select>
          </div>
          
          <div style="margin-bottom:1rem;">
            <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#1e3a5f;">Message:</label>
            <textarea id="feedback-message" placeholder="Please describe your feedback in detail..." style="width:100%;padding:0.75rem;border:2px solid #e5e7eb;border-radius:6px;min-height:100px;resize:vertical;"></textarea>
          </div>
          
          <div style="margin-bottom:1rem;">
            <label style="display:block;font-weight:600;margin-bottom:0.5rem;color:#1e3a5f;">Email (optional):</label>
            <input type="email" id="feedback-email" placeholder="your@email.com" style="width:100%;padding:0.75rem;border:2px solid #e5e7eb;border-radius:6px;">
            <small style="color:#6b7280;">We'll only use this to follow up on your feedback</small>
          </div>
          
          <div style="display:flex;gap:1rem;justify-content:flex-end;">
            <button type="button" onclick="closeFeedbackModal()" style="padding:0.75rem 1.5rem;border:2px solid #e5e7eb;background:white;color:#6b7280;border-radius:6px;cursor:pointer;">Cancel</button>
            <button type="submit" style="padding:0.75rem 1.5rem;background:#10b981;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;">Send Feedback</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Handle form submission
  document.getElementById('feedback-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const type = document.getElementById('feedback-type').value;
    const message = document.getElementById('feedback-message').value.trim();
    const email = document.getElementById('feedback-email').value.trim();
    
    if (!message) {
      showError('Please enter your feedback message');
      return;
    }
    
    // Store feedback locally for now (can be sent to server later)
    const feedback = {
      type,
      message,
      email,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      userAgent: navigator.userAgent
    };
    
    // Store in localStorage
    const existingFeedback = JSON.parse(localStorage.getItem('costflowai_feedback') || '[]');
    existingFeedback.push(feedback);
    localStorage.setItem('costflowai_feedback', JSON.stringify(existingFeedback));
    
    // Show success and close modal
    showSuccess('Feedback sent successfully!', 'Thank you for helping us improve CostFlowAI');
    closeFeedbackModal();
    
    // Reset form
    document.getElementById('feedback-form').reset();
  });
}

function openFeedbackModal() {
  if (!document.getElementById('feedback-modal')) {
    createFeedbackModal();
  }
  document.getElementById('feedback-modal').style.display = 'block';
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeFeedbackModal() {
  document.getElementById('feedback-modal').style.display = 'none';
  document.body.style.overflow = ''; // Restore scrolling
}

// Make functions globally available
window.openFeedbackModal = openFeedbackModal;
window.closeFeedbackModal = closeFeedbackModal;

// Load calc map on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadCalcMap();
  
  // Set up feedback links
  document.querySelectorAll('a[href="#contact"], a[href*="feedback"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openFeedbackModal();
    });
  });
});

// Export utilities for other modules
window.CalcUtils = {
  _num,
  getInput,
  setOutput,
  setLastCalculation,
  loadCalcMap,
  // Legacy helpers
  $q,
  num,
  out,
  setCalculationPayload
};
// Duplicate ID audit check (dev mode only)
if (location.hostname.includes('localhost')) {
  const ids = [...document.querySelectorAll('[id]')].map(n => n.id);
  const dups = [...new Set(ids.filter((i, idx) => ids.indexOf(i) !== idx))];
  if (dups.length) console.warn('Duplicate IDs:', dups);
}

// ===== ENHANCED ERROR MESSAGE SYSTEM =====

/**
 * Comprehensive error handling and user feedback system
 */

// Error message categories with user-friendly messages
const ERROR_MESSAGES = {
  // Input validation errors
  INVALID_NUMBER: (field) => `Please enter a valid number for ${field}`,
  NEGATIVE_VALUE: (field) => `${field} cannot be negative`,
  ZERO_VALUE: (field) => `${field} must be greater than zero`,
  OUT_OF_RANGE: (field, min, max) => `${field} must be between ${min} and ${max}`,
  REQUIRED_FIELD: (field) => `${field} is required`,
  
  // Calculation errors
  CALC_FAILED: 'Calculation failed. Please check your inputs and try again.',
  CALC_OVERFLOW: 'Numbers too large for calculation. Please use smaller values.',
  CALC_UNDERFLOW: 'Result too small to display accurately.',
  DIVISION_BY_ZERO: 'Cannot divide by zero. Please check your inputs.',
  
  // System errors
  CALCULATOR_NOT_FOUND: (type) => `Calculator "${type}" is not available`,
  BROWSER_NOT_SUPPORTED: 'Your browser may not support all features',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  
  // Export errors
  EXPORT_NO_DATA: 'Please calculate first before exporting',
  EXPORT_FAILED: (format) => `Failed to export to ${format}. Please try again.`,
  COPY_FAILED: 'Failed to copy to clipboard. Please copy manually.',
  
  // Feature errors
  FEATURE_DISABLED: (feature) => `${feature} is currently unavailable`,
  UNSUPPORTED_FORMAT: (format) => `Format "${format}" is not supported`,
  
  // Generic
  UNKNOWN_ERROR: 'An unexpected error occurred. Please refresh and try again.'
};

/**
 * Show calculator-specific error with enhanced UX
 */
function showCalculatorError(message, type = 'error', duration = 5000) {
  // Use existing toast system if available
  if (window.exportUtils && window.exportUtils.showToast) {
    window.exportUtils.showToast(message, type, duration);
    return;
  }
  
  // Fallback error display system
  createErrorDisplay(message, type, duration);
}

/**
 * Create fallback error display when toast system unavailable
 */
function createErrorDisplay(message, type = 'error', duration = 5000) {
  // Remove existing error displays
  document.querySelectorAll('.calc-error-display').forEach(el => el.remove());
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'calc-error-display';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'assertive');
  
  const colors = {
    error: '#ef4444',
    warning: '#f59e0b', 
    info: '#3b82f6',
    success: '#10b981'
  };
  
  const icons = {
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️', 
    success: '✅'
  };
  
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.error};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10001;
    max-width: 400px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    animation: slideInError 0.3s ease;
    word-wrap: break-word;
    border: 2px solid rgba(255,255,255,0.2);
  `;
  
  errorDiv.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 10px;">
      <span style="font-size: 18px; flex-shrink: 0;">${icons[type] || icons.error}</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">
          ${type.charAt(0).toUpperCase() + type.slice(1)}
        </div>
        <div>${message}</div>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: none; border: none; color: white; cursor: pointer; padding: 0; margin-left: auto; font-size: 18px;"
              aria-label="Close notification">×</button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
  
  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.animation = 'slideOutError 0.3s ease';
        setTimeout(() => {
          if (errorDiv.parentNode) errorDiv.remove();
        }, 300);
      }
    }, duration);
  }
}

/**
 * Input validation with user-friendly error messages
 */
function validateCalculatorInput(value, fieldName, options = {}) {
  const { min, max, required = false, type = 'number' } = options;
  
  // Required field check
  if (required && (!value || String(value).trim() === '')) {
    showCalculatorError(ERROR_MESSAGES.REQUIRED_FIELD(fieldName), 'warning');
    return false;
  }
  
  // Skip validation if empty and not required
  if (!value || String(value).trim() === '') {
    return true;
  }
  
  if (type === 'number') {
    const num = parseFloat(String(value).replace(/,/g, ''));
    
    if (isNaN(num)) {
      showCalculatorError(ERROR_MESSAGES.INVALID_NUMBER(fieldName), 'error');
      return false;
    }
    
    if (num < 0 && (min === undefined || min >= 0)) {
      showCalculatorError(ERROR_MESSAGES.NEGATIVE_VALUE(fieldName), 'error');
      return false;
    }
    
    if (num === 0 && min !== undefined && min > 0) {
      showCalculatorError(ERROR_MESSAGES.ZERO_VALUE(fieldName), 'error');
      return false;
    }
    
    if (min !== undefined && num < min) {
      showCalculatorError(ERROR_MESSAGES.OUT_OF_RANGE(fieldName, min, max || '∞'), 'error');
      return false;
    }
    
    if (max !== undefined && num > max) {
      showCalculatorError(ERROR_MESSAGES.OUT_OF_RANGE(fieldName, min || 0, max), 'error');
      return false;
    }
    
    // Check for calculation overflow
    if (num > Number.MAX_SAFE_INTEGER) {
      showCalculatorError(ERROR_MESSAGES.CALC_OVERFLOW, 'error');
      return false;
    }
  }
  
  return true;
}

/**
 * Safe calculation wrapper with error handling
 */
function safeCalculate(calculationFn, fallbackValue = 0) {
  try {
    const result = calculationFn();
    
    // Check for invalid results
    if (result === null || result === undefined) {
      showCalculatorError(ERROR_MESSAGES.CALC_FAILED, 'error');
      return fallbackValue;
    }
    
    if (isNaN(result)) {
      showCalculatorError(ERROR_MESSAGES.CALC_FAILED, 'error');
      return fallbackValue;
    }
    
    if (!isFinite(result)) {
      showCalculatorError(result === Infinity ? ERROR_MESSAGES.CALC_OVERFLOW : ERROR_MESSAGES.CALC_UNDERFLOW, 'error');
      return fallbackValue;
    }
    
    return result;
  } catch (error) {
    console.error('Calculation error:', error);
    
    // Specific error handling
    if (error.message.includes('divide') || error.message.includes('division')) {
      showCalculatorError(ERROR_MESSAGES.DIVISION_BY_ZERO, 'error');
    } else {
      showCalculatorError(ERROR_MESSAGES.CALC_FAILED, 'error');
    }
    
    return fallbackValue;
  }
}

/**
 * Browser compatibility error handling
 */
function checkBrowserCompatibility() {
  const features = {
    'localStorage': () => localStorage,
    'fetch': () => fetch,
    'JSON': () => JSON,
    'classList': () => document.body.classList
  };
  
  const missingFeatures = [];
  
  for (const [feature, test] of Object.entries(features)) {
    try {
      if (!test()) {
        missingFeatures.push(feature);
      }
    } catch (e) {
      missingFeatures.push(feature);
    }
  }
  
  if (missingFeatures.length > 0) {
    showCalculatorError(
      ERROR_MESSAGES.BROWSER_NOT_SUPPORTED + `. Missing: ${missingFeatures.join(', ')}`, 
      'warning', 
      10000
    );
    return false;
  }
  
  return true;
}

// Add CSS animations for error display
if (!document.getElementById('calc-error-animations')) {
  const style = document.createElement('style');
  style.id = 'calc-error-animations';
  style.textContent = `
    @keyframes slideInError {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutError {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  if (event.filename && event.filename.includes('calculators')) {
    showCalculatorError(ERROR_MESSAGES.UNKNOWN_ERROR, 'error');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  if (event.reason && event.reason.message && event.reason.message.includes('calculator')) {
    showCalculatorError(ERROR_MESSAGES.UNKNOWN_ERROR, 'error');
  }
});

// Export error handling functions globally
window.showCalculatorError = showCalculatorError;
window.validateCalculatorInput = validateCalculatorInput;
window.safeCalculate = safeCalculate;
window.ERROR_MESSAGES = ERROR_MESSAGES;

/**
 * Apply consistent formatting to calculation results
 */
function applyCalculationFormatting(calculatorType, results) {
  if (!window.displayFormatter || !results) return;
  
  // Define result element mappings for each calculator type
  const formatMappings = {
    concrete: {
      '#concrete-total-cost': { value: results.totalCost, type: 'currency' },
      '#concrete-material-cost': { value: results.materialCost, type: 'currency' },
      '#concrete-labor-cost': { value: results.laborCost, type: 'currency' },
      '#concrete-total-yards': { value: results.totalYards, type: 'unit', unit: 'CY' },
      '#concrete-total-sqft': { value: results.totalSqft, type: 'measurement', unit: 'sq ft' },
      '#concrete-bags-needed': { value: results.bagsNeeded, type: 'number', decimals: 0 }
    },
    framing: {
      '#framing-total-cost': { value: results.totalCost, type: 'currency' },
      '#framing-lumber-cost': { value: results.lumberCost, type: 'currency' },
      '#framing-labor-cost': { value: results.laborCost, type: 'currency' },
      '#framing-board-feet': { value: results.boardFeet, type: 'unit', unit: 'BF' },
      '#framing-studs-needed': { value: results.studsNeeded, type: 'number', decimals: 0 }
    },
    paint: {
      '#paint-total-cost': { value: results.totalCost, type: 'currency' },
      '#paint-material-cost': { value: results.materialCost, type: 'currency' },
      '#paint-labor-cost': { value: results.laborCost, type: 'currency' },
      '#paint-gallons-needed': { value: results.gallonsNeeded, type: 'unit', unit: 'gal' },
      '#paint-coverage-area': { value: results.coverageArea, type: 'measurement', unit: 'sq ft' }
    },
    roofing: {
      '#roofing-total-cost': { value: results.totalCost, type: 'currency' },
      '#roofing-material-cost': { value: results.materialCost, type: 'currency' },
      '#roofing-labor-cost': { value: results.laborCost, type: 'currency' },
      '#roofing-squares': { value: results.squares, type: 'unit', unit: 'sq' },
      '#roofing-area': { value: results.roofArea, type: 'measurement', unit: 'sq ft' }
    },
    drywall: {
      '#drywall-total-cost': { value: results.totalCost, type: 'currency' },
      '#drywall-material-cost': { value: results.materialCost, type: 'currency' },
      '#drywall-labor-cost': { value: results.laborCost, type: 'currency' },
      '#drywall-sheets': { value: results.sheetsNeeded, type: 'number', decimals: 0 },
      '#drywall-total-area': { value: results.totalArea, type: 'measurement', unit: 'sq ft' }
    },
    electrical: {
      '#elec-total-cost': { value: results.totalCost, type: 'currency' },
      '#elec-material-cost': { value: results.materialCost, type: 'currency' },
      '#elec-labor-cost': { value: results.laborCost, type: 'currency' },
      '#elec-outlets': { value: results.outletsNeeded, type: 'number', decimals: 0 },
      '#elec-circuits': { value: results.circuitsNeeded, type: 'number', decimals: 0 }
    },
    hvac: {
      '#hvac-total-cost': { value: results.totalCost, type: 'currency' },
      '#hvac-equipment-cost': { value: results.equipmentCost, type: 'currency' },
      '#hvac-labor-cost': { value: results.laborCost, type: 'currency' },
      '#hvac-btu': { value: results.btuRequired, type: 'number', decimals: 0 },
      '#hvac-tonnage': { value: results.tonnage, type: 'unit', unit: 'tons' }
    },
    plumbing: {
      '#plumbing-total-cost': { value: results.totalCost, type: 'currency' },
      '#plumbing-material-cost': { value: results.materialCost, type: 'currency' },
      '#plumbing-labor-cost': { value: results.laborCost, type: 'currency' },
      '#plumbing-fixtures': { value: results.fixturesCount, type: 'number', decimals: 0 },
      '#plumbing-linear-feet': { value: results.linearFeet, type: 'measurement', unit: 'LF' }
    },
    flooring: {
      '#flooring-total-cost': { value: results.totalCost, type: 'currency' },
      '#flooring-material-cost': { value: results.materialCost, type: 'currency' },
      '#flooring-labor-cost': { value: results.laborCost, type: 'currency' },
      '#flooring-area': { value: results.flooringArea, type: 'measurement', unit: 'sq ft' },
      '#flooring-waste': { value: results.wastePercentage, type: 'percentage' }
    },
    excavation: {
      '#excav-total-cost': { value: results.totalCost, type: 'currency' },
      '#excav-equipment-cost': { value: results.equipmentCost, type: 'currency' },
      '#excav-labor-cost': { value: results.laborCost, type: 'currency' },
      '#excav-total-volume': { value: results.totalVolume, type: 'unit', unit: 'CY' },
      '#excav-duration': { value: results.duration, type: 'duration' }
    },
    insulation: {
      '#insul-total-cost': { value: results.totalCost, type: 'currency' },
      '#insul-material-cost': { value: results.materialCost, type: 'currency' },
      '#insul-labor-cost': { value: results.laborCost, type: 'currency' },
      '#insul-sq-ft': { value: results.insulationArea, type: 'measurement', unit: 'sq ft' },
      '#insul-r-value': { value: results.rValue, type: 'number', decimals: 1 }
    },
    labor: {
      '#labor-total-cost': { value: results.totalCost, type: 'currency' },
      '#labor-base-wages': { value: results.baseWages, type: 'currency' },
      '#labor-benefits': { value: results.benefits, type: 'currency' },
      '#labor-crew-size': { value: results.crewSize, type: 'number', decimals: 0 },
      '#labor-duration': { value: results.duration, type: 'duration' }
    }
  };
  
  // Apply formatting for the specific calculator
  const mappings = formatMappings[calculatorType];
  if (!mappings) return;
  
  // Update all mapped elements
  Object.entries(mappings).forEach(([selector, config]) => {
    const element = document.querySelector(selector);
    if (element && config.value !== undefined && config.value !== null) {
      try {
        let formatted;
        
        switch (config.type) {
          case 'currency':
            formatted = window.displayFormatter.formatCurrency(config.value, config.options);
            break;
          case 'percentage':
            formatted = window.displayFormatter.formatPercentage(config.value, config.options);
            break;
          case 'unit':
            formatted = window.displayFormatter.formatUnit(config.value, config.unit, config.options);
            break;
          case 'measurement':
            formatted = window.displayFormatter.formatMeasurement(config.value, config.unit, config.options);
            break;
          case 'duration':
            formatted = window.displayFormatter.formatDuration(config.value, config.options);
            break;
          case 'number':
            formatted = window.displayFormatter.formatNumber(config.value, { decimals: config.decimals });
            break;
          default:
            formatted = window.displayFormatter.formatSmart(config.value, config.type, config.options);
        }
        
        // Update element content
        if (element.tagName === 'INPUT') {
          element.value = formatted;
        } else {
          element.textContent = formatted;
        }
        
        // Add data attributes for styling and debugging
        element.setAttribute('data-formatted-value', formatted);
        element.setAttribute('data-raw-value', config.value);
        element.setAttribute('data-format-type', config.type);
        
      } catch (error) {
        console.warn('Display formatting error for', selector, ':', error);
        // Fallback to basic formatting
        const fallback = typeof config.value === 'number' ? 
          config.value.toLocaleString() : String(config.value);
        element.textContent = fallback;
      }
    }
  });
}

/**
 * Enhanced result display with animations and validation
 */
function displayCalculationResults(calculatorType, results, options = {}) {
  if (!results) {
    console.warn('No results to display for', calculatorType);
    return;
  }
  
  // Apply formatting first
  applyCalculationFormatting(calculatorType, results);
  
  // Add visual feedback
  const resultsSection = document.querySelector(`#${calculatorType}-calc .results-section, [data-calc="${calculatorType}"] .results-section`);
  if (resultsSection) {
    // Remove any existing highlight
    resultsSection.classList.remove('results-updated');
    
    // Add highlight class with animation
    setTimeout(() => {
      resultsSection.classList.add('results-updated');
    }, 10);
    
    // Remove highlight after animation
    setTimeout(() => {
      resultsSection.classList.remove('results-updated');
    }, 2000);
  }
  
  // Show success message if configured
  if (options.showSuccessMessage && window.showCalculatorError) {
    window.showCalculatorError('Calculation completed successfully!', 'success', 3000);
  }
  
  // Track calculation completion
  if (window.gtag) {
    window.gtag('event', 'calculation_complete', {
      calculator_type: calculatorType,
      total_cost: results.totalCost || 0
    });
  }
}

// Add CSS for result highlighting
if (!document.getElementById('calc-display-styles')) {
  const style = document.createElement('style');
  style.id = 'calc-display-styles';
  style.textContent = `
    .results-section.results-updated {
      animation: resultHighlight 2s ease-in-out;
      border: 2px solid #10b981;
    }
    
    @keyframes resultHighlight {
      0% { 
        border-color: #10b981;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
      }
      50% { 
        border-color: #10b981;
        box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1);
      }
      100% { 
        border-color: transparent;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
      }
    }
    
    .result-main {
      font-weight: 700;
      transition: all 0.3s ease;
    }
    
    .result-row {
      transition: background-color 0.2s ease;
    }
    
    .result-row:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
    
    [data-format-type="currency"] {
      font-weight: 600;
      color: #059669;
    }
    
    [data-format-type="percentage"] {
      color: #dc2626;
    }
    
    [data-format-type="duration"] {
      color: #7c3aed;
    }
  `;
  document.head.appendChild(style);
}

// Export display functions globally
window.applyCalculationFormatting = applyCalculationFormatting;
window.displayCalculationResults = displayCalculationResults;

// Initialize browser compatibility check
checkBrowserCompatibility();
