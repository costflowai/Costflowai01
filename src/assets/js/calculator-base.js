/**
 * Base Calculator Class
 * Provides common functionality for all construction calculators
 * Eliminates DRY violations and provides consistent interface
 * @version 1.0.0
 */

class CalculatorBase {
    
    constructor(options = {}) {
        this.type = options.type || 'generic';
        this.formId = options.formId || `${this.type}Calculator`;
        this.resultsId = options.resultsId || 'results-container';
        
        this.inputs = new Map();
        this.results = new Map();
        this.validationRules = new Map();
        this.formatters = new Map();
        
        this.state = {
            isCalculating: false,
            lastCalculation: null,
            errors: new Map()
        };
        
        this.setupDefaultFormatters();
        this.init();
    }
    
    /**
     * Initialize calculator
     */
    init() {
        this.bindEvents();
        this.loadSavedData();
        
        // Auto-calculate if all required fields have values
        if (this.hasAllRequiredInputs()) {
            this.calculate();
        }
    }
    
    /**
     * Setup default value formatters
     */
    setupDefaultFormatters() {
        this.formatters.set('currency', (value) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value || 0);
        });
        
        this.formatters.set('number', (value, decimals = 2) => {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: decimals
            }).format(value || 0);
        });
        
        this.formatters.set('dimension', (value, unit = 'ft') => {
            const formatted = this.formatters.get('number')(value, 1);
            return `${formatted} ${unit}`;
        });
        
        this.formatters.set('volume', (value, unit = 'cu yd') => {
            const formatted = this.formatters.get('number')(value, 2);
            return `${formatted} ${unit}`;
        });
        
        this.formatters.set('weight', (value, unit = 'lbs') => {
            const formatted = this.formatters.get('number')(value, 0);
            return `${formatted} ${unit}`;
        });
        
        this.formatters.set('percentage', (value) => {
            return `${this.formatters.get('number')(value, 1)}%`;
        });
    }
    
    /**
     * Bind form events
     */
    bindEvents() {
        const form = document.getElementById(this.formId);
        if (!form) return;
        
        // Input change events
        form.addEventListener('input', this.debounce(this.handleInputChange.bind(this), 300));
        form.addEventListener('change', this.handleInputChange.bind(this));
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculate();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }
    
    /**
     * Handle input changes with validation
     * @param {Event} event 
     */
    handleInputChange(event) {
        const field = event.target;
        const fieldName = field.name || field.id;
        
        if (!fieldName) return;
        
        try {
            // Update internal state
            this.inputs.set(fieldName, field.value);
            
            // Validate field
            this.validateField(fieldName, field.value);
            
            // Auto-calculate if all inputs are valid
            if (this.areAllInputsValid() && this.hasAllRequiredInputs()) {
                this.calculate();
            }
            
        } catch (error) {
            console.error('Input handling error:', error);
            SecureDOM.showNotification('Input validation error', 'error', 3000);
        }
    }
    
    /**
     * Validate individual field
     * @param {string} fieldName 
     * @param {any} value 
     */
    validateField(fieldName, value) {
        const rules = this.validationRules.get(fieldName);
        if (!rules) return true;
        
        const errors = [];
        
        rules.forEach(rule => {
            const isValid = this.runValidationRule(rule, value);
            if (!isValid) {
                errors.push(rule.message || `Invalid ${fieldName}`);
            }
        });
        
        if (errors.length > 0) {
            this.state.errors.set(fieldName, errors);
            this.showFieldErrors(fieldName, errors);
            return false;
        } else {
            this.state.errors.delete(fieldName);
            this.clearFieldErrors(fieldName);
            return true;
        }
    }
    
    /**
     * Run individual validation rule
     * @param {Object} rule 
     * @param {any} value 
     */
    runValidationRule(rule, value) {
        const validators = {
            required: (val) => val !== null && val !== undefined && String(val).trim() !== '',
            number: (val) => !isNaN(parseFloat(val)) && isFinite(val),
            positive: (val) => parseFloat(val) > 0,
            min: (val, min) => parseFloat(val) >= parseFloat(min),
            max: (val, max) => parseFloat(val) <= parseFloat(max),
            range: (val, min, max) => {
                const num = parseFloat(val);
                return num >= parseFloat(min) && num <= parseFloat(max);
            }
        };
        
        const validator = validators[rule.type];
        if (!validator) return true;
        
        return validator(value, rule.min, rule.max);
    }
    
    /**
     * Show field validation errors
     * @param {string} fieldName 
     * @param {Array} errors 
     */
    showFieldErrors(fieldName, errors) {
        const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) return;
        
        field.classList.add('error', 'invalid');
        field.setAttribute('aria-invalid', 'true');
        
        // Remove existing error messages
        const existingErrors = field.parentNode.querySelectorAll('.field-error');
        existingErrors.forEach(el => el.remove());
        
        // Add new error messages
        errors.forEach(error => {
            const errorEl = SecureDOM.createElement(field.parentNode, 'div', {
                className: 'field-error',
                style: { color: '#e53e3e', fontSize: '0.875rem', marginTop: '0.25rem' }
            }, SecureDOM.sanitizeString(error));
        });
    }
    
    /**
     * Clear field validation errors
     * @param {string} fieldName 
     */
    clearFieldErrors(fieldName) {
        const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) return;
        
        field.classList.remove('error', 'invalid');
        field.setAttribute('aria-invalid', 'false');
        
        // Remove error messages
        const errorMessages = field.parentNode.querySelectorAll('.field-error');
        errorMessages.forEach(el => el.remove());
    }
    
    /**
     * Main calculation method (to be overridden by subclasses)
     */
    async calculate() {
        if (this.state.isCalculating) return;
        
        this.state.isCalculating = true;
        this.showLoadingState();
        
        try {
            // Get all input values
            const inputs = this.getAllInputs();
            
            // Validate all inputs
            if (!this.validateAllInputs(inputs)) {
                throw new Error('Invalid inputs');
            }
            
            // Perform calculation (implemented by subclass)
            const results = await this.performCalculation(inputs);
            
            // Store results
            this.results = new Map(Object.entries(results));
            this.state.lastCalculation = {
                inputs: { ...inputs },
                results: { ...results },
                timestamp: new Date().toISOString()
            };
            
            // Display results
            this.displayResults(results);
            
            // Show success message
            SecureDOM.showNotification('Calculation completed successfully!', 'success', 3000);
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.handleCalculationError(error);
        } finally {
            this.state.isCalculating = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Perform the actual calculation (to be implemented by subclasses)
     * @param {Object} inputs 
     * @returns {Object} results
     */
    async performCalculation(inputs) {
        throw new Error('performCalculation method must be implemented by subclass');
    }
    
    /**
     * Get all input values from form
     * @returns {Object} Input values
     */
    getAllInputs() {
        const form = document.getElementById(this.formId);
        if (!form) return {};
        
        const formData = new FormData(form);
        return Object.fromEntries(formData.entries());
    }
    
    /**
     * Validate all inputs
     * @param {Object} inputs 
     * @returns {boolean} Are all inputs valid
     */
    validateAllInputs(inputs) {
        let isValid = true;
        
        Object.entries(inputs).forEach(([fieldName, value]) => {
            if (!this.validateField(fieldName, value)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    /**
     * Check if all inputs are currently valid
     * @returns {boolean}
     */
    areAllInputsValid() {
        return this.state.errors.size === 0;
    }
    
    /**
     * Check if all required inputs have values
     * @returns {boolean}
     */
    hasAllRequiredInputs() {
        const requiredFields = [];
        
        this.validationRules.forEach((rules, fieldName) => {
            if (rules.some(rule => rule.type === 'required')) {
                requiredFields.push(fieldName);
            }
        });
        
        return requiredFields.every(fieldName => {
            const value = this.inputs.get(fieldName);
            return value !== null && value !== undefined && String(value).trim() !== '';
        });
    }
    
    /**
     * Display calculation results
     * @param {Object} results 
     */
    displayResults(results) {
        const container = document.getElementById(this.resultsId);
        if (!container) return;
        
        // Clear previous results
        container.textContent = '';
        
        // Create results display (can be customized by subclasses)
        this.createResultsDisplay(container, results);
        
        // Show results container
        container.style.display = 'block';
        
        // Scroll to results
        container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    /**
     * Create results display (to be customized by subclasses)
     * @param {Element} container 
     * @param {Object} results 
     */
    createResultsDisplay(container, results) {
        Object.entries(results).forEach(([key, value]) => {
            const row = SecureDOM.createElement(container, 'div', { className: 'result-row' });
            SecureDOM.createElement(row, 'span', { className: 'result-label' }, this.formatLabel(key));
            SecureDOM.createElement(row, 'span', { className: 'result-value' }, this.formatValue(key, value));
        });
    }
    
    /**
     * Format result label for display
     * @param {string} key 
     * @returns {string}
     */
    formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1')
                 .replace(/^./, str => str.toUpperCase())
                 .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Format result value for display
     * @param {string} key 
     * @param {any} value 
     * @returns {string}
     */
    formatValue(key, value) {
        // Try to find a specific formatter for this key
        if (this.formatters.has(key)) {
            return this.formatters.get(key)(value);
        }
        
        // Use default formatters based on value type/name
        if (key.toLowerCase().includes('cost') || key.toLowerCase().includes('price')) {
            return this.formatters.get('currency')(value);
        }
        
        if (key.toLowerCase().includes('volume')) {
            return this.formatters.get('volume')(value);
        }
        
        if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('percent')) {
            return this.formatters.get('percentage')(value);
        }
        
        if (typeof value === 'number') {
            return this.formatters.get('number')(value);
        }
        
        return String(value || '');
    }
    
    /**
     * Show loading state during calculation
     */
    showLoadingState() {
        const button = document.querySelector(`#${this.formId} button[type="button"], #${this.formId} button[type="submit"]`);
        if (button) {
            SecureDOM.setLoadingState(button, true, 'Calculating...');
        }
    }
    
    /**
     * Hide loading state after calculation
     */
    hideLoadingState() {
        const button = document.querySelector(`#${this.formId} button[type="button"], #${this.formId} button[type="submit"]`);
        if (button) {
            SecureDOM.setLoadingState(button, false);
        }
    }
    
    /**
     * Handle calculation errors
     * @param {Error} error 
     */
    handleCalculationError(error) {
        console.error(`${this.type} calculation error:`, error);
        
        let message = 'An error occurred during calculation. Please check your inputs.';
        
        if (error.message.includes('Invalid inputs')) {
            message = 'Please correct the highlighted errors in your inputs.';
        } else if (error.message.includes('Network')) {
            message = 'Network error. Please check your connection and try again.';
        }
        
        SecureDOM.showNotification(message, 'error', 5000);
    }
    
    /**
     * Save calculation to localStorage
     */
    saveCalculation() {
        try {
            if (!this.state.lastCalculation) {
                SecureDOM.showNotification('Please calculate first before saving.', 'info', 3000);
                return;
            }
            
            const saveData = {
                type: this.type,
                ...this.state.lastCalculation
            };
            
            localStorage.setItem(`${this.type}Calc`, JSON.stringify(saveData));
            SecureDOM.showNotification('Calculation saved successfully!', 'success', 3000);
            
        } catch (error) {
            console.error('Save error:', error);
            SecureDOM.showNotification('Failed to save calculation.', 'error', 3000);
        }
    }
    
    /**
     * Load saved calculation data
     */
    loadSavedData() {
        try {
            const saved = localStorage.getItem(`${this.type}Calc`);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.inputs) {
                    this.populateForm(data.inputs);
                }
            }
        } catch (error) {
            console.error('Load saved data error:', error);
        }
    }
    
    /**
     * Populate form with data
     * @param {Object} data 
     */
    populateForm(data) {
        Object.entries(data).forEach(([fieldName, value]) => {
            const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (field) {
                field.value = value;
                this.inputs.set(fieldName, value);
            }
        });
    }
    
    /**
     * Export calculation as CSV
     */
    exportCSV() {
        try {
            if (!this.state.lastCalculation) {
                SecureDOM.showNotification('Please calculate first before exporting.', 'info', 3000);
                return;
            }
            
            const data = this.state.lastCalculation;
            let csv = 'Type,Parameter,Value\n';
            
            // Add inputs
            Object.entries(data.inputs).forEach(([key, value]) => {
                const sanitizedKey = String(key).replace(/[,"\n\r]/g, '');
                const sanitizedValue = String(value).replace(/[,"\n\r]/g, '');
                csv += `Input,${sanitizedKey},${sanitizedValue}\n`;
            });
            
            // Add results
            Object.entries(data.results).forEach(([key, value]) => {
                const sanitizedKey = String(key).replace(/[,"\n\r]/g, '');
                const sanitizedValue = String(value).replace(/[,"\n\r]/g, '');
                csv += `Result,${sanitizedKey},${sanitizedValue}\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${this.type}_calculation_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            SecureDOM.showNotification('CSV exported successfully!', 'success', 3000);
            
        } catch (error) {
            console.error('Export error:', error);
            SecureDOM.showNotification('Failed to export CSV.', 'error', 3000);
        }
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event 
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + Enter to calculate
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            this.calculate();
        }
        
        // Ctrl/Cmd + S to save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveCalculation();
        }
    }
    
    /**
     * Debounce function for performance
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    debounce(func, wait) {
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
    
    /**
     * Add validation rule for field
     * @param {string} fieldName 
     * @param {Object} rule 
     */
    addValidationRule(fieldName, rule) {
        if (!this.validationRules.has(fieldName)) {
            this.validationRules.set(fieldName, []);
        }
        this.validationRules.get(fieldName).push(rule);
    }
    
    /**
     * Add custom formatter
     * @param {string} key 
     * @param {Function} formatter 
     */
    addFormatter(key, formatter) {
        this.formatters.set(key, formatter);
    }
    
    /**
     * Get current calculation state
     * @returns {Object}
     */
    getState() {
        return {
            ...this.state,
            inputs: Object.fromEntries(this.inputs),
            results: Object.fromEntries(this.results)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculatorBase;
}

// Make available globally
window.CalculatorBase = CalculatorBase;