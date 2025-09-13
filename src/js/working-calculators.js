/**
 * CostFlowAI Calculator Engine
 * Fixes the 0.00 calculation issue by implementing working calculator logic
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏗️ Initializing CostFlowAI calculators...');
    
    // Initialize all calculators
    initConcreteCalculator();
    initFramingCalculator();
    initPaintCalculator();
    initRoofingCalculator();
    initElectricalCalculator();
    initHVACCalculator();
    initDrywallCalculator();
    initFlooringCalculator();
    initInsulationCalculator();
    initTileCalculator();
    initPlumbingCalculator();
    initLandscapingCalculator();
    
    console.log('✅ All calculators initialized and ready');
});

// Concrete Calculator Implementation
function initConcreteCalculator() {
    const concreteSection = document.querySelector('#concrete-calc, [data-calculator="concrete"], .concrete-calculator');
    if (!concreteSection) return;
    
    const inputs = concreteSection.querySelectorAll('input, select');
    const calculateBtn = concreteSection.querySelector('[data-action="calculate"], .btn-calculate');
    
    // Add event listeners
    inputs.forEach(input => {
        input.addEventListener('input', debounce(calculateConcrete, 300));
        input.addEventListener('change', calculateConcrete);
    });
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateConcrete);
    }
    
    console.log('✅ Concrete calculator initialized');
}

function calculateConcrete() {
    try {
        // Get input values with multiple selectors for compatibility
        const length = getInputValue(['#concrete-length', '#length', '[name="length"]', '[data-field="length"]']);
        const width = getInputValue(['#concrete-width', '#width', '[name="width"]', '[data-field="width"]']);  
        const thickness = getInputValue(['#concrete-thickness', '#thickness', '[name="thickness"]', '[data-field="thickness"]']);
        const psi = getSelectValue(['#concrete-psi', '#psi', '[name="psi"]'], 3500);
        
        console.log('Concrete inputs:', { length, width, thickness, psi });
        
        if (length > 0 && width > 0 && thickness > 0) {
            // Calculate volume
            const area = length * width;
            const volumeCuFt = area * (thickness / 12);
            const volumeCuYd = volumeCuFt / 27;
            const withWaste = volumeCuYd * 1.1; // 10% waste factor
            
            // Calculate costs
            const psiPricing = { 2500: 125, 3000: 130, 3500: 135, 4000: 140, 4500: 145 };
            const pricePerYard = psiPricing[psi] || 135;
            const materialCost = withWaste * pricePerYard;
            const laborCost = withWaste * 45; // $45/yard labor
            const deliveryCost = 150; // Standard delivery
            const totalCost = materialCost + laborCost + deliveryCost;
            
            // Update displays
            const results = {
                area: area.toFixed(0) + ' sq ft',
                volume: volumeCuFt.toFixed(2) + ' cu ft',
                yards: withWaste.toFixed(2) + ' cu yd',
                materialCost: '$' + materialCost.toFixed(0),
                laborCost: '$' + laborCost.toFixed(0),
                deliveryCost: '$' + deliveryCost.toFixed(0),
                totalCost: '$' + totalCost.toFixed(0)
            };
            
            updateDisplay('concrete', results);
            showFormula('concrete', { length, width, thickness, psi, results });
            
            console.log('✅ Concrete calculation completed:', results);
        } else {
            console.log('❌ Invalid concrete inputs:', { length, width, thickness });
        }
    } catch (error) {
        console.error('❌ Concrete calculation error:', error);
    }
}

// Framing Calculator Implementation
function initFramingCalculator() {
    const framingSection = document.querySelector('#framing-calc, [data-calculator="framing"], .framing-calculator');
    if (!framingSection) return;
    
    const inputs = framingSection.querySelectorAll('input, select');
    const calculateBtn = framingSection.querySelector('[data-action="calculate"], .btn-calculate');
    
    inputs.forEach(input => {
        input.addEventListener('input', debounce(calculateFraming, 300));
        input.addEventListener('change', calculateFraming);
    });
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateFraming);
    }
    
    console.log('✅ Framing calculator initialized');
}

function calculateFraming() {
    try {
        const area = getInputValue(['#framing-area', '#area', '[name="area"]', '[data-field="area"]']);
        const lumberSize = getSelectValue(['#framing-lumber-size', '#lumber-size', '[name="lumber_size"]'], '2x4');
        const spacing = getSelectValue(['#framing-spacing', '#spacing', '[name="spacing"]'], 16);
        
        console.log('Framing inputs:', { area, lumberSize, spacing });
        
        if (area > 0) {
            // Calculate lumber requirements
            const spacingFactor = 16 / spacing; // 16" OC baseline
            const linearFeet = area * 1.8 * spacingFactor; // 1.8 LF per sq ft for walls
            
            // Board feet calculation
            const boardFeetPerLF = { '2x4': 0.67, '2x6': 1.0, '2x8': 1.33, '2x10': 1.67, '2x12': 2.0 };
            const boardFeet = linearFeet * (boardFeetPerLF[lumberSize] || 0.67);
            
            // Cost calculations
            const pricePerBF = 0.75; // $0.75 per board foot
            const materialCost = boardFeet * pricePerBF * 1.1; // 10% waste
            const hardwareCost = area * 0.35; // Hardware per sq ft
            const laborCost = area * 2.25; // Labor per sq ft
            const totalCost = materialCost + hardwareCost + laborCost;
            
            const results = {
                area: area.toFixed(0) + ' sq ft',
                linearFeet: linearFeet.toFixed(0) + ' lin ft',
                boardFeet: boardFeet.toFixed(0) + ' bd ft',
                materialCost: '$' + materialCost.toFixed(0),
                hardwareCost: '$' + hardwareCost.toFixed(0),
                laborCost: '$' + laborCost.toFixed(0),
                totalCost: '$' + totalCost.toFixed(0)
            };
            
            updateDisplay('framing', results);
            showFormula('framing', { area, lumberSize, spacing, results });
            
            console.log('✅ Framing calculation completed:', results);
        }
    } catch (error) {
        console.error('❌ Framing calculation error:', error);
    }
}

// Paint Calculator Implementation
function initPaintCalculator() {
    const paintSection = document.querySelector('#paint-calc, [data-calculator="paint"], .paint-calculator');
    if (!paintSection) return;
    
    const inputs = paintSection.querySelectorAll('input, select');
    const calculateBtn = paintSection.querySelector('[data-action="calculate"], .btn-calculate');
    
    inputs.forEach(input => {
        input.addEventListener('input', debounce(calculatePaint, 300));
        input.addEventListener('change', calculatePaint);
    });
    
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculatePaint);
    }
    
    console.log('✅ Paint calculator initialized');
}

function calculatePaint() {
    try {
        const wallArea = getInputValue(['#paint-wall-area', '#wall-area', '[name="wall_area"]', '[data-field="wall_area"]']);
        const openings = getInputValue(['#paint-openings', '#openings', '[name="openings"]'], 0);
        const coats = getSelectValue(['#paint-coats', '#coats', '[name="coats"]'], 2);
        const quality = getSelectValue(['#paint-quality', '#quality', '[name="quality"]'], 'standard');
        
        console.log('Paint inputs:', { wallArea, openings, coats, quality });
        
        if (wallArea > 0) {
            const paintableArea = Math.max(0, wallArea - openings);
            const coverageRate = 400; // sq ft per gallon
            const gallonsNeeded = (paintableArea * coats) / coverageRate;
            const gallons = Math.ceil(gallonsNeeded * 4) / 4; // Round to nearest quart
            
            // Paint pricing
            const paintPricing = { economy: 35, standard: 55, premium: 75, luxury: 95 };
            const pricePerGallon = paintPricing[quality] || 55;
            const materialCost = gallons * pricePerGallon;
            const laborCost = paintableArea * 2.50; // $2.50 per sq ft
            const totalCost = materialCost + laborCost;
            
            const results = {
                paintableArea: paintableArea.toFixed(0) + ' sq ft',
                gallons: gallons.toFixed(2) + ' gallons',
                materialCost: '$' + materialCost.toFixed(0),
                laborCost: '$' + laborCost.toFixed(0),
                totalCost: '$' + totalCost.toFixed(0)
            };
            
            updateDisplay('paint', results);
            showFormula('paint', { wallArea, openings, coats, quality, results });
            
            console.log('✅ Paint calculation completed:', results);
        }
    } catch (error) {
        console.error('❌ Paint calculation error:', error);
    }
}

// Roofing Calculator (placeholder - will implement if needed)
function initRoofingCalculator() {
    console.log('✅ Roofing calculator placeholder initialized');
}

// Additional calculator placeholders
function initElectricalCalculator() { console.log('✅ Electrical calculator placeholder initialized'); }
function initHVACCalculator() { console.log('✅ HVAC calculator placeholder initialized'); }
function initDrywallCalculator() { console.log('✅ Drywall calculator placeholder initialized'); }
function initFlooringCalculator() { console.log('✅ Flooring calculator placeholder initialized'); }
function initInsulationCalculator() { console.log('✅ Insulation calculator placeholder initialized'); }
function initTileCalculator() { console.log('✅ Tile calculator placeholder initialized'); }
function initPlumbingCalculator() { console.log('✅ Plumbing calculator placeholder initialized'); }
function initLandscapingCalculator() { console.log('✅ Landscaping calculator placeholder initialized'); }

// Utility Functions
function getInputValue(selectors, defaultValue = 0) {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.value !== '') {
            const value = parseFloat(element.value);
            return isNaN(value) ? defaultValue : value;
        }
    }
    return defaultValue;
}

function getSelectValue(selectors, defaultValue = '') {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.value !== '') {
            return element.value;
        }
    }
    return defaultValue;
}

function updateDisplay(calculatorType, results) {
    // Update results in multiple possible locations
    const selectors = [
        `#${calculatorType}-results`,
        `.${calculatorType}-results`,
        `[data-results="${calculatorType}"]`,
        '.project-results',
        '.materials-needed'
    ];
    
    let updated = false;
    
    for (const selector of selectors) {
        const container = document.querySelector(selector);
        if (container) {
            // Clear existing content
            container.innerHTML = '';
            
            // Create results HTML
            const resultsHTML = Object.entries(results).map(([key, value]) => {
                const label = formatLabel(key);
                return `
                    <div class="result-row" style="display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #eee;">
                        <span class="result-label" style="font-weight: 600; color: #374151;">${label}:</span>
                        <span class="result-value" style="color: #059669; font-weight: 700;">${value}</span>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = `
                <div class="calculation-results" style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">📊 Calculation Results</h3>
                    ${resultsHTML}
                </div>
            `;
            
            container.style.display = 'block';
            updated = true;
            break;
        }
    }
    
    if (!updated) {
        console.warn(`❌ No results container found for ${calculatorType}`);
    } else {
        console.log(`✅ Results updated for ${calculatorType}`);
    }
}

function showFormula(calculatorType, data) {
    const formulaSelectors = [
        `#${calculatorType}-formula`,
        `.${calculatorType}-formula`,
        `[data-formula="${calculatorType}"]`
    ];
    
    for (const selector of formulaSelectors) {
        const container = document.querySelector(selector);
        if (container) {
            const formulas = {
                concrete: `
                    <h4>🧮 Calculation Formula</h4>
                    <p><strong>Volume:</strong> ${data.length}' × ${data.width}' × ${data.thickness}"/12 = ${data.results.volume}</p>
                    <p><strong>Concrete:</strong> Volume ÷ 27 × 1.1 (waste) = ${data.results.yards}</p>
                    <p><strong>Cost:</strong> ${data.results.yards} × $${data.psi === 3500 ? 135 : 130}/yd³ + Labor + Delivery</p>
                `,
                framing: `
                    <h4>🧮 Calculation Formula</h4>
                    <p><strong>Linear Feet:</strong> ${data.area} sq ft × 1.8 × spacing factor = ${data.results.linearFeet}</p>
                    <p><strong>Board Feet:</strong> Linear feet × lumber factor (${data.lumberSize})</p>
                    <p><strong>Total Cost:</strong> Materials + Hardware + Labor</p>
                `,
                paint: `
                    <h4>🧮 Calculation Formula</h4>
                    <p><strong>Paintable Area:</strong> ${data.wallArea} - ${data.openings} = ${data.results.paintableArea}</p>
                    <p><strong>Paint Needed:</strong> Area × ${data.coats} coats ÷ 400 sq ft/gal = ${data.results.gallons}</p>
                    <p><strong>Total Cost:</strong> Material (${data.quality}) + Labor ($2.50/sq ft)</p>
                `
            };
            
            container.innerHTML = `
                <div class="formula-transparency" style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6;">
                    ${formulas[calculatorType] || '<p>Formula details available</p>'}
                </div>
            `;
            break;
        }
    }
}

function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/cu ft/i, 'Cu Ft')
        .replace(/cu yd/i, 'Cu Yd')
        .replace(/sq ft/i, 'Sq Ft')
        .replace(/lin ft/i, 'Lin Ft')
        .replace(/bd ft/i, 'Bd Ft')
        .trim();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Global calculation trigger (for legacy compatibility)
window.calculate = function() {
    console.log('🔄 Manual calculation triggered');
    calculateConcrete();
    calculateFraming(); 
    calculatePaint();
};

// Export for debugging
window.CostFlowAI = {
    calculateConcrete,
    calculateFraming,
    calculatePaint,
    updateDisplay,
    showFormula
};

console.log('🚀 CostFlowAI Calculator Engine loaded successfully');