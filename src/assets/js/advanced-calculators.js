/**
 * CostFlowAI Advanced Calculator Suite
 * Professional-grade construction calculators with save/share/compare functionality
 * ROM estimates only - always verify with contractors
 */

class AdvancedCalculator {
    constructor(name, version = '1.0') {
        this.name = name;
        this.version = version;
        this.inputs = {};
        this.results = {};
        this.scenarios = [];
        this.history = [];
        this.units = 'imperial'; // imperial or metric
        
        // Load saved calculations
        this.loadSavedCalculations();
    }

    // Core calculation method - to be overridden by specific calculators
    calculate() {
        throw new Error('Calculate method must be implemented by subclass');
    }

    // Input validation
    validateInputs(inputs) {
        const errors = [];
        for (const [key, value] of Object.entries(inputs)) {
            if (value === null || value === undefined || value === '') {
                errors.push(`${key} is required`);
            }
            if (typeof value === 'number' && (isNaN(value) || value < 0)) {
                errors.push(`${key} must be a positive number`);
            }
        }
        return errors;
    }

    // Save calculation to localStorage
    saveCalculation(notes = '') {
        const calc = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            inputs: { ...this.inputs },
            results: { ...this.results },
            notes: notes,
            version: this.version
        };
        
        let saved = JSON.parse(localStorage.getItem(`calc_${this.name}`) || '[]');
        saved.unshift(calc); // Add to beginning
        
        // Keep only last 50 calculations
        if (saved.length > 50) saved = saved.slice(0, 50);
        
        localStorage.setItem(`calc_${this.name}`, JSON.stringify(saved));
        this.showNotification('Calculation saved successfully', 'success');
        return calc.id;
    }

    // Load saved calculations
    loadSavedCalculations() {
        try {
            const saved = JSON.parse(localStorage.getItem(`calc_${this.name}`) || '[]');
            return saved;
        } catch (e) {
            console.error('Error loading saved calculations:', e);
            return [];
        }
    }

    // Delete saved calculation
    deleteSavedCalculation(id) {
        let saved = this.loadSavedCalculations();
        saved = saved.filter(calc => calc.id !== id);
        localStorage.setItem(`calc_${this.name}`, JSON.stringify(saved));
        this.showNotification('Calculation deleted', 'info');
    }

    // Export to CSV
    exportToCSV() {
        if (!this.results || Object.keys(this.results).length === 0) {
            this.showNotification('No results to export', 'warning');
            return;
        }

        let csv = `${this.name} Calculation Export\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n\n`;
        
        // Inputs section
        csv += "INPUTS:\n";
        for (const [key, value] of Object.entries(this.inputs)) {
            csv += `${this.formatLabel(key)},${value}\n`;
        }
        
        csv += "\nRESULTS:\n";
        for (const [key, value] of Object.entries(this.results)) {
            if (typeof value === 'object' && value !== null) {
                csv += `${this.formatLabel(key)},\n`;
                for (const [subKey, subValue] of Object.entries(value)) {
                    csv += `,${this.formatLabel(subKey)},${subValue}\n`;
                }
            } else {
                csv += `${this.formatLabel(key)},${value}\n`;
            }
        }
        
        csv += "\nDISCLAIMER:\n";
        csv += "ROM estimates only - verify with licensed contractors,\n";
        csv += "Actual costs may vary significantly,\n";
        csv += "For planning purposes only\n";
        
        this.downloadFile(csv, `${this.name}_${this.formatDate()}.csv`, 'text/csv');
    }

    // Export to PDF (print-friendly)
    generatePDF() {
        // Add print-specific styles
        document.body.classList.add('printing');
        
        // Hide non-essential elements for print
        const hideElements = document.querySelectorAll('.no-print');
        hideElements.forEach(el => el.style.display = 'none');
        
        window.print();
        
        // Restore after print
        setTimeout(() => {
            document.body.classList.remove('printing');
            hideElements.forEach(el => el.style.display = '');
        }, 1000);
    }

    // Generate shareable link
    shareableLink() {
        try {
            const params = btoa(JSON.stringify(this.inputs));
            const url = `${window.location.origin}${window.location.pathname}?calc=${params}`;
            
            if (navigator.clipboard) {
                navigator.clipboard.writeText(url);
                this.showNotification('Shareable link copied to clipboard', 'success');
            }
            return url;
        } catch (e) {
            this.showNotification('Error generating shareable link', 'error');
            return null;
        }
    }

    // Load from shareable link
    loadFromLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const calcParam = urlParams.get('calc');
        
        if (calcParam) {
            try {
                this.inputs = JSON.parse(atob(calcParam));
                this.populateForm();
                this.calculate();
                this.showNotification('Calculation loaded from link', 'info');
            } catch (e) {
                this.showNotification('Invalid calculation link', 'error');
            }
        }
    }

    // Compare scenarios
    addScenario(name) {
        if (!this.results || Object.keys(this.results).length === 0) {
            this.showNotification('Complete a calculation first', 'warning');
            return;
        }

        const scenario = {
            id: this.generateId(),
            name: name || `Scenario ${this.scenarios.length + 1}`,
            inputs: { ...this.inputs },
            results: { ...this.results },
            timestamp: new Date()
        };
        
        this.scenarios.push(scenario);
        this.updateScenariosList();
        this.showNotification(`Scenario "${scenario.name}" saved`, 'success');
        return scenario.id;
    }

    // Compare two scenarios
    compareScenarios(scenario1Id, scenario2Id) {
        const s1 = this.scenarios.find(s => s.id === scenario1Id);
        const s2 = this.scenarios.find(s => s.id === scenario2Id);
        
        if (!s1 || !s2) {
            this.showNotification('Scenarios not found', 'error');
            return null;
        }

        const comparison = {
            scenario1: s1.name,
            scenario2: s2.name,
            differences: {}
        };

        // Compare main result values
        for (const key in s1.results) {
            if (typeof s1.results[key] === 'number' && typeof s2.results[key] === 'number') {
                const diff = s2.results[key] - s1.results[key];
                const percentDiff = s1.results[key] !== 0 ? (diff / s1.results[key] * 100) : 0;
                
                comparison.differences[key] = {
                    value1: s1.results[key],
                    value2: s2.results[key],
                    difference: diff,
                    percentageDifference: percentDiff
                };
            }
        }

        return comparison;
    }

    // Toggle units (Imperial/Metric)
    toggleUnits() {
        this.units = this.units === 'imperial' ? 'metric' : 'imperial';
        this.convertAllValues();
        this.updateDisplayUnits();
        this.showNotification(`Switched to ${this.units} units`, 'info');
    }

    // Unit conversion methods
    convertAllValues() {
        // Override in specific calculators for unit-specific conversions
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatNumber(number, decimals = 2) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1')
                 .replace(/_/g, ' ')
                 .replace(/^./, str => str.toUpperCase());
    }

    formatDate() {
        return new Date().toISOString().split('T')[0];
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // File download helper
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // UI Helper methods
    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.calc-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `calc-notification calc-notification-${type}`;
        notification.textContent = message;
        
        // Styles for notifications
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        // Type-specific colors
        const colors = {
            success: '#059669',
            error: '#dc2626',
            warning: '#d97706',
            info: '#0369a1'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Form population helper
    populateForm() {
        for (const [key, value] of Object.entries(this.inputs)) {
            const input = document.getElementById(key);
            if (input) {
                input.value = value;
            }
        }
    }

    // Add ROM disclaimer to results
    addROMDisclaimer() {
        return `
            <div class="rom-disclaimer" style="background:#fff3cd; border:1px solid #ffeaa7; padding:1rem; border-radius:8px; margin:1rem 0;">
                <h5 style="color:#856404; margin-bottom:0.5rem;">⚠️ Important ROM Disclaimer</h5>
                <p style="color:#856404; margin:0; font-size:0.9rem;">
                    <strong>These are Rough Order of Magnitude (ROM) estimates only.</strong> 
                    Actual costs may vary significantly based on site conditions, local labor rates, 
                    material availability, and project complexity. Always obtain detailed quotes 
                    from licensed contractors before making construction decisions.
                </p>
            </div>
        `;
    }

    // Generate assumptions list
    generateAssumptions(assumptions = []) {
        if (assumptions.length === 0) return '';
        
        return `
            <div style="background:#f9fafb; padding:1rem; border-radius:8px; margin:1rem 0;">
                <h4>📋 Assumptions</h4>
                <ul style="margin:0.5rem 0; padding-left:1.5rem;">
                    ${assumptions.map(assumption => `<li>${assumption}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Update scenarios list in UI
    updateScenariosList() {
        const container = document.getElementById('scenarios-list');
        if (!container) return;

        container.innerHTML = this.scenarios.map(scenario => `
            <div class="scenario-item" data-id="${scenario.id}">
                <span>${scenario.name}</span>
                <button onclick="loadScenario('${scenario.id}')" class="btn-small">Load</button>
                <button onclick="deleteScenario('${scenario.id}')" class="btn-small btn-danger">Delete</button>
            </div>
        `).join('');
    }

    // Common material price database (2025 estimates)
    static getMaterialPrices() {
        return {
            concrete: {
                '2500psi': 115, '3000psi': 130, '3500psi': 145, '4000psi': 160, '5000psi': 185
            },
            lumber: {
                '2x4_8ft': 4.50, '2x4_10ft': 6.25, '2x4_12ft': 8.75, '2x4_16ft': 12.50,
                '2x6_8ft': 7.25, '2x6_10ft': 9.50, '2x6_12ft': 12.75, '2x6_16ft': 18.25,
                '2x8_8ft': 9.75, '2x8_10ft': 12.25, '2x8_12ft': 16.50, '2x8_16ft': 24.75,
                '2x10_8ft': 14.25, '2x10_10ft': 17.75, '2x10_12ft': 22.50, '2x10_16ft': 32.50
            },
            rebar: {
                '#3': 0.85, '#4': 1.25, '#5': 1.95, '#6': 2.85, '#7': 3.95, '#8': 5.25
            },
            drywall: {
                '1/2_4x8': 12.50, '5/8_4x8': 14.25, '1/2_4x12': 18.75, '5/8_4x12': 21.25
            },
            insulation: {
                'batt_r13': 0.65, 'batt_r15': 0.75, 'batt_r19': 0.85, 'batt_r21': 0.95,
                'blown_r30': 1.25, 'blown_r38': 1.55, 'blown_r49': 2.15
            }
        };
    }

    // Common labor rates by trade (per hour, 2025)
    static getLaborRates() {
        return {
            general_laborer: 22, carpenter: 32, electrician: 45, plumber: 48,
            concrete_finisher: 35, roofer: 28, painter: 25, flooring_installer: 30,
            hvac_tech: 42, mason: 38, welder: 35, heavy_equipment: 55,
            foreman: 45, superintendent: 65
        };
    }

    // Regional cost multipliers
    static getRegionalFactors() {
        return {
            national: 1.0,
            west_coast: { materials: 1.35, labor: 1.45 },
            northeast: { materials: 1.25, labor: 1.35 },
            southeast: { materials: 0.95, labor: 0.88 },
            midwest: { materials: 0.92, labor: 0.85 },
            southwest: { materials: 1.05, labor: 0.95 },
            mountain: { materials: 1.08, labor: 1.02 }
        };
    }
}

// Add animation styles to page
if (!document.getElementById('calc-animations')) {
    const style = document.createElement('style');
    style.id = 'calc-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .calc-notification {
            animation: slideIn 0.3s ease;
        }
        @media print {
            .no-print { display: none !important; }
            .printing { font-size: 12px; }
        }
    `;
    document.head.appendChild(style);
}

// Export for use in calculator pages
if (typeof window !== 'undefined') {
    window.AdvancedCalculator = AdvancedCalculator;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedCalculator;
}