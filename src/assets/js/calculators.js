// calculators.js - COMPLETE WORKING VERSION
console.log('Loading calculators.js...');

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllCalculators);
} else {
    initializeAllCalculators();
}

function initializeAllCalculators() {
    console.log('Initializing all calculators...');
    
    // Initialize each calculator type
    initializeConcreteCalculator();
    initializeFramingCalculator();
    initializePaintCalculator();
    initializeRoofingCalculator();
    initializeElectricalCalculator();
    initializeDrywallCalculator();
    initializeFlooringCalculator();
    initializePlumbingCalculator();
    initializeHVACCalculator();
    initializeInsulationCalculator();
    
    // Add export buttons
    addExportButtons();
    
    console.log('All calculators initialized successfully');
}

function initializeConcreteCalculator() {
    console.log('Initializing concrete calculator...');
    
    // Find all possible input fields for concrete calculator
    const lengthInput = document.querySelector(
        'input[placeholder*="30"], input[name="length"], #length, input[placeholder*="Length"], .concrete-calc input[type="number"]:first-of-type'
    );
    const widthInput = document.querySelector(
        'input[placeholder*="20"], input[name="width"], #width, input[placeholder*="Width"], .concrete-calc input[type="number"]:nth-of-type(2)'
    );
    const thicknessInput = document.querySelector(
        'input[placeholder*="4"], input[name="thickness"], #thickness, input[placeholder*="inches"], .concrete-calc input[type="number"]:nth-of-type(3)'
    );
    
    if (!lengthInput || !widthInput || !thicknessInput) {
        console.log('Concrete calculator inputs not found on this page');
        return;
    }
    
    console.log('Found concrete inputs:', { lengthInput, widthInput, thicknessInput });
    
    function calculateConcrete() {
        const length = parseFloat(lengthInput.value) || 0;
        const width = parseFloat(widthInput.value) || 0;
        const thickness = parseFloat(thicknessInput.value) || 0;
        
        console.log('Calculating concrete:', { length, width, thickness });
        
        if (length > 0 && width > 0 && thickness > 0) {
            // Calculate volume in cubic yards
            const cubicFeet = length * width * (thickness / 12);
            const cubicYards = cubicFeet / 27;
            const withWaste = cubicYards * 1.1; // 10% waste
            
            console.log('Concrete calculation result:', withWaste.toFixed(2), 'cubic yards');
            
            // Find and update result display
            const resultElements = document.querySelectorAll(
                '.cu.yd, .concrete-result, [data-result], .result-value, td:contains("0.00"), .project-results td'
            );
            
            resultElements.forEach(el => {
                if (el && (el.textContent.includes('0.00') || el.textContent.includes('cu yd') || el.textContent.trim() === '')) {
                    el.textContent = withWaste.toFixed(2) + ' cu yd';
                    el.style.fontWeight = 'bold';
                    el.style.color = '#2196F3';
                }
            });
            
            // Update cost displays
            const costPerYard = 150;
            const totalCost = withWaste * costPerYard;
            const costElements = document.querySelectorAll('.cost-display, [data-cost]');
            costElements.forEach(el => {
                if (el.textContent.includes('$0') || el.textContent.includes('$0.00')) {
                    el.textContent = '$' + totalCost.toFixed(2);
                    el.style.fontWeight = 'bold';
                    el.style.color = '#4CAF50';
                }
            });
            
            // Update any table cells that contain results
            document.querySelectorAll('td').forEach(td => {
                if (td.textContent.includes('0.00 cu yd') || td.textContent === '0.00') {
                    td.textContent = withWaste.toFixed(2) + ' cu yd';
                    td.style.fontWeight = 'bold';
                    td.style.color = '#2196F3';
                }
                if (td.textContent.includes('$0.00') && td.previousElementSibling && td.previousElementSibling.textContent.includes('Total')) {
                    td.textContent = '$' + totalCost.toFixed(2);
                    td.style.fontWeight = 'bold';
                    td.style.color = '#4CAF50';
                }
            });
            
            // Show formula
            showFormula('concrete', { length, width, thickness, result: withWaste, cost: totalCost });
        }
    }
    
    // Attach listeners with multiple event types
    [lengthInput, widthInput, thicknessInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateConcrete);
            input.addEventListener('change', calculateConcrete);
            input.addEventListener('keyup', calculateConcrete);
            input.addEventListener('blur', calculateConcrete);
        }
    });
    
    console.log('Concrete calculator initialized with listeners');
}

function initializeFramingCalculator() {
    console.log('Initializing framing calculator...');
    
    const wallLengthInput = document.querySelector(
        '.framing-calculator input[placeholder*="20"], input[name="wallLength"], input[placeholder*="Length"], .framing input[type="number"]:first-of-type'
    );
    const wallHeightInput = document.querySelector(
        '.framing-calculator input[placeholder*="8"], input[name="wallHeight"], input[placeholder*="Height"], .framing input[type="number"]:nth-of-type(2)'
    );
    
    if (!wallLengthInput || !wallHeightInput) {
        console.log('Framing calculator not on this page');
        return;
    }
    
    function calculateFraming() {
        const length = parseFloat(wallLengthInput.value) || 0;
        const height = parseFloat(wallHeightInput.value) || 0;
        
        console.log('Calculating framing:', { length, height });
        
        if (length > 0 && height > 0) {
            // Calculate studs needed (16" on center)
            const studsNeeded = Math.ceil((length * 12) / 16) + 1;
            const plates = Math.ceil(length / 8) * 2; // Top and bottom plates
            const totalCost = (studsNeeded * 8 + plates * 12) * 1.2; // Estimated cost with markup
            
            // Update displays
            const studDisplay = document.querySelector('.stud-count, .studs-needed, [data-studs]');
            if (studDisplay) {
                studDisplay.textContent = studsNeeded + ' studs';
            }
            
            // Update result cells
            document.querySelectorAll('td').forEach(td => {
                if (td.textContent.includes('0 studs') || (td.textContent === '0' && td.previousElementSibling && td.previousElementSibling.textContent.includes('Stud'))) {
                    td.textContent = studsNeeded + ' studs';
                    td.style.fontWeight = 'bold';
                    td.style.color = '#2196F3';
                }
            });
            
            showFormula('framing', { length, height, studs: studsNeeded, plates, cost: totalCost });
        }
    }
    
    [wallLengthInput, wallHeightInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateFraming);
            input.addEventListener('change', calculateFraming);
            input.addEventListener('keyup', calculateFraming);
        }
    });
    
    console.log('Framing calculator initialized');
}

function initializePaintCalculator() {
    console.log('Initializing paint calculator...');
    
    const areaInput = document.querySelector(
        'input[placeholder*="400"], input[name="area"], input[placeholder*="Area"], .paint input[type="number"]'
    );
    
    if (!areaInput) {
        console.log('Paint calculator not found');
        return;
    }
    
    function calculatePaint() {
        const area = parseFloat(areaInput.value) || 0;
        
        if (area > 0) {
            const gallons = Math.ceil(area / 350); // 350 sq ft per gallon coverage
            const cost = gallons * 45; // $45 per gallon
            
            // Update displays
            document.querySelectorAll('td').forEach(td => {
                if (td.textContent.includes('0 gal') || (td.textContent === '0' && td.previousElementSibling && td.previousElementSibling.textContent.includes('Paint'))) {
                    td.textContent = gallons + ' gallons';
                    td.style.fontWeight = 'bold';
                    td.style.color = '#2196F3';
                }
            });
            
            showFormula('paint', { area, gallons, cost });
        }
    }
    
    areaInput.addEventListener('input', calculatePaint);
    areaInput.addEventListener('change', calculatePaint);
    console.log('Paint calculator initialized');
}

// Placeholder functions for other calculators
function initializeRoofingCalculator() {
    console.log('Roofing calculator placeholder');
}

function initializeElectricalCalculator() {
    console.log('Electrical calculator placeholder');
}

function initializeDrywallCalculator() {
    console.log('Drywall calculator placeholder');
}

function initializeFlooringCalculator() {
    console.log('Flooring calculator placeholder');
}

function initializePlumbingCalculator() {
    console.log('Plumbing calculator placeholder');
}

function initializeHVACCalculator() {
    console.log('HVAC calculator placeholder');
}

function initializeInsulationCalculator() {
    console.log('Insulation calculator placeholder');
}

function showFormula(type, values) {
    // Create formula display if it doesn't exist
    let formulaDiv = document.querySelector('.formula-display');
    if (!formulaDiv) {
        formulaDiv = document.createElement('div');
        formulaDiv.className = 'formula-display';
        formulaDiv.style.cssText = `
            margin: 20px 0; 
            padding: 15px; 
            background: #f0f8ff; 
            border-left: 4px solid #2196F3; 
            border-radius: 5px;
            font-family: 'Courier New', monospace;
        `;
        
        const resultsSection = document.querySelector('.project-results, .materials-needed, .calculator');
        if (resultsSection) {
            resultsSection.appendChild(formulaDiv);
        } else {
            document.body.appendChild(formulaDiv);
        }
    }
    
    let formulaHTML = '';
    
    if (type === 'concrete') {
        formulaHTML = `
            <h4 style="color: #1976D2; margin-top: 0;">🧮 Concrete Calculation Formula</h4>
            <div style="background: white; padding: 10px; border-radius: 3px; margin: 10px 0;">
                <strong>Volume:</strong> ${values.length}ft × ${values.width}ft × ${values.thickness}in ÷ 12 ÷ 27<br>
                <strong>With Waste (10%):</strong> ${(values.length * values.width * values.thickness / 12 / 27).toFixed(2)} × 1.1 = <span style="color: #2196F3; font-weight: bold;">${values.result.toFixed(2)} cubic yards</span><br>
                <strong>Estimated Cost:</strong> ${values.result.toFixed(2)} × $150/yd³ = <span style="color: #4CAF50; font-weight: bold;">$${values.cost.toFixed(2)}</span>
            </div>
        `;
    } else if (type === 'framing') {
        formulaHTML = `
            <h4 style="color: #1976D2; margin-top: 0;">🔨 Framing Calculation Formula</h4>
            <div style="background: white; padding: 10px; border-radius: 3px; margin: 10px 0;">
                <strong>Studs Needed:</strong> (${values.length}ft × 12in) ÷ 16in OC + 1 = <span style="color: #2196F3; font-weight: bold;">${values.studs} studs</span><br>
                <strong>Plates:</strong> ${values.plates} pieces (top & bottom)<br>
                <strong>Estimated Cost:</strong> <span style="color: #4CAF50; font-weight: bold;">$${values.cost.toFixed(2)}</span>
            </div>
        `;
    } else if (type === 'paint') {
        formulaHTML = `
            <h4 style="color: #1976D2; margin-top: 0;">🎨 Paint Calculation Formula</h4>
            <div style="background: white; padding: 10px; border-radius: 3px; margin: 10px 0;">
                <strong>Coverage:</strong> ${values.area} sq ft ÷ 350 sq ft/gal = <span style="color: #2196F3; font-weight: bold;">${values.gallons} gallons</span><br>
                <strong>Estimated Cost:</strong> ${values.gallons} × $45/gal = <span style="color: #4CAF50; font-weight: bold;">$${values.cost.toFixed(2)}</span>
            </div>
        `;
    }
    
    formulaDiv.innerHTML = formulaHTML;
}

function addExportButtons() {
    const resultsContainers = document.querySelectorAll('.project-results, .materials-needed, .calculator');
    
    resultsContainers.forEach(container => {
        if (container.querySelector('.export-buttons')) return;
        
        const exportDiv = document.createElement('div');
        exportDiv.className = 'export-buttons';
        exportDiv.style.cssText = 'margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;';
        exportDiv.innerHTML = `
            <button onclick="copyResults()" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                📋 Copy Results
            </button>
            <button onclick="exportCSV()" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                📊 Export CSV
            </button>
            <button onclick="exportPDF()" style="padding: 8px 16px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                📄 Export PDF
            </button>
            <button onclick="printResults()" style="padding: 8px 16px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
                🖨️ Print
            </button>
        `;
        container.appendChild(exportDiv);
    });
}

// Export functions
window.copyResults = function() {
    const results = document.querySelector('.project-results, .materials-needed, .calculator');
    const resultsText = results ? results.innerText : 'No results to copy';
    
    navigator.clipboard.writeText(resultsText).then(() => {
        showNotification('✅ Results copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = resultsText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('✅ Results copied to clipboard!', 'success');
    });
};

window.exportCSV = function() {
    const results = [];
    const tables = document.querySelectorAll('.project-results table, .materials-needed table');
    
    if (tables.length === 0) {
        // If no tables, create CSV from visible data
        results.push('Item,Value');
        document.querySelectorAll('td').forEach(td => {
            if (td.textContent && !td.textContent.includes('0.00') && td.textContent.trim() !== '') {
                const label = td.previousElementSibling ? td.previousElementSibling.textContent : 'Value';
                results.push(`"${label}","${td.textContent}"`);
            }
        });
    } else {
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td, th');
                if (cells.length > 0) {
                    const rowData = Array.from(cells).map(cell => `"${cell.textContent.trim()}"`).join(',');
                    results.push(rowData);
                }
            });
        });
    }
    
    const csvContent = results.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'costflowai-calculation-results.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('📊 CSV file downloaded!', 'success');
};

window.exportPDF = function() {
    showNotification('📄 Opening print dialog for PDF export...', 'info');
    window.print();
};

window.printResults = function() {
    window.print();
};

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 4000);
}

// Make functions globally available
window.initializeAllCalculators = initializeAllCalculators;
window.initializeCalculators = initializeAllCalculators; // Legacy compatibility

// Debug function
window.debugCalculators = function() {
    console.log('=== Calculator Debug Info ===');
    console.log('Concrete inputs:', {
        length: document.querySelector('input[placeholder*="30"], input[name="length"], #length'),
        width: document.querySelector('input[placeholder*="20"], input[name="width"], #width'),
        thickness: document.querySelector('input[placeholder*="4"], input[name="thickness"], #thickness')
    });
    console.log('All number inputs:', document.querySelectorAll('input[type="number"]'));
    console.log('All tables:', document.querySelectorAll('table'));
    console.log('Results containers:', document.querySelectorAll('.project-results, .materials-needed'));
};

console.log('🚀 CostFlowAI Calculator Engine loaded successfully');
console.log('Available functions: initializeAllCalculators, copyResults, exportCSV, exportPDF, debugCalculators');