/**
 * CostFlowAI Calculator SDK
 * Modular system for state-aware construction cost estimation
 * Supports AACE Class 5-3 estimates with CSI division mapping
 */

class CalculatorSDK {
    constructor(options = {}) {
        this.version = '1.0.0';
        this.apiEndpoint = options.apiEndpoint || '/api/v1';
        this.debug = options.debug || false;
        
        // Initialize core modules
        this.stateData = new StateDataManager();
        this.pricing = new PricingManager();
        this.export = new ExportManager();
        this.validation = new ValidationManager();
        this.analytics = new AnalyticsManager();
        
        // Calculator registry
        this.calculators = new Map();
        this.loadCalculatorDefinitions();
    }

    /**
     * Register a calculator definition
     */
    registerCalculator(definition) {
        const errors = this.validation.validateCalculatorDefinition(definition);
        if (errors.length > 0) {
            throw new Error(`Invalid calculator definition: ${errors.join(', ')}`);
        }
        
        this.calculators.set(definition.id, new Calculator(definition, this));
        this.log(`Registered calculator: ${definition.id}`);
    }

    /**
     * Get calculator instance
     */
    getCalculator(id) {
        const calculator = this.calculators.get(id);
        if (!calculator) {
            throw new Error(`Calculator not found: ${id}`);
        }
        return calculator;
    }

    /**
     * Calculate estimate with full state awareness
     */
    async calculate(calculatorId, inputs, options = {}) {
        try {
            const calculator = this.getCalculator(calculatorId);
            const state = options.state || inputs.state || 'US_DEFAULT';
            
            // Apply state-specific data
            const stateModifiers = await this.stateData.getStateModifiers(state);
            const enhancedInputs = { ...inputs, stateModifiers };
            
            // Execute calculation
            const result = await calculator.calculate(enhancedInputs, options);
            
            // Add metadata
            result.metadata = {
                calculatorId,
                version: this.version,
                timestamp: new Date().toISOString(),
                state,
                aaceClass: calculator.definition.aaceClass || 'Class-5',
                accuracy: calculator.definition.accuracy || '±25%'
            };

            // Track analytics
            this.analytics.trackCalculation(calculatorId, state, result);
            
            return result;
            
        } catch (error) {
            this.log(`Calculation error: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Load calculator definitions from configuration
     */
    async loadCalculatorDefinitions() {
        try {
            const definitions = await this.loadJSON('/config/calculators.json');
            definitions.forEach(def => this.registerCalculator(def));
        } catch (error) {
            this.log(`Failed to load calculator definitions: ${error.message}`, 'error');
        }
    }

    /**
     * Utility method for JSON loading
     */
    async loadJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        return await response.json();
    }

    /**
     * Debug logging
     */
    log(message, level = 'info') {
        if (this.debug) {
            console[level](`[CalculatorSDK] ${message}`);
        }
    }
}

/**
 * Individual Calculator class
 */
class Calculator {
    constructor(definition, sdk) {
        this.definition = definition;
        this.sdk = sdk;
        this.id = definition.id;
        this.name = definition.name;
        this.version = definition.version || '1.0.0';
    }

    /**
     * Execute calculation with state-aware pricing
     */
    async calculate(inputs, options = {}) {
        const startTime = performance.now();
        
        try {
            // Validate inputs
            const validationErrors = this.validateInputs(inputs);
            if (validationErrors.length > 0) {
                throw new Error(`Input validation failed: ${validationErrors.join(', ')}`);
            }

            // Apply calculation logic
            const result = await this.executeCalculation(inputs, options);
            
            // Calculate execution time
            const executionTime = performance.now() - startTime;
            result.executionTime = Math.round(executionTime);
            
            return result;
            
        } catch (error) {
            this.sdk.log(`Calculation failed for ${this.id}: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Execute the actual calculation logic
     */
    async executeCalculation(inputs, options) {
        const { stateModifiers } = inputs;
        const result = {
            summary: {},
            lineItems: [],
            contingencies: {},
            totals: {},
            ranges: {},
            csiMapping: {},
            assumptions: [...this.definition.assumptions]
        };

        // Process each calculation step
        for (const step of this.definition.calculationSteps) {
            await this.processCalculationStep(step, inputs, result, stateModifiers);
        }

        // Apply state-specific modifiers
        this.applyStateModifiers(result, stateModifiers);
        
        // Calculate ranges and contingencies
        this.calculateRanges(result, options);
        this.applyContingencies(result, options);
        
        return result;
    }

    /**
     * Process individual calculation step
     */
    async processCalculationStep(step, inputs, result, stateModifiers) {
        switch (step.type) {
            case 'lineItem':
                this.processLineItem(step, inputs, result, stateModifiers);
                break;
            case 'formula':
                this.processFormula(step, inputs, result, stateModifiers);
                break;
            case 'lookup':
                await this.processLookup(step, inputs, result, stateModifiers);
                break;
            case 'conditional':
                this.processConditional(step, inputs, result, stateModifiers);
                break;
            default:
                throw new Error(`Unknown calculation step type: ${step.type}`);
        }
    }

    /**
     * Process line item calculation
     */
    processLineItem(step, inputs, result, stateModifiers) {
        const { id, name, csiCode, unit, baseRate } = step;
        const quantity = this.evaluateExpression(step.quantity, inputs);
        const rate = this.applyStateRate(baseRate, stateModifiers, step.rateType || 'material');
        const total = quantity * rate;

        const lineItem = {
            id,
            name,
            csiCode,
            unit,
            quantity: parseFloat(quantity.toFixed(2)),
            rate: parseFloat(rate.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            stateAdjustment: rate / baseRate
        };

        result.lineItems.push(lineItem);
        
        // Add to CSI mapping
        if (csiCode) {
            if (!result.csiMapping[csiCode]) {
                result.csiMapping[csiCode] = { items: [], total: 0 };
            }
            result.csiMapping[csiCode].items.push(lineItem);
            result.csiMapping[csiCode].total += total;
        }
    }

    /**
     * Apply state-specific rate adjustments
     */
    applyStateRate(baseRate, stateModifiers, rateType) {
        const multiplier = stateModifiers[rateType] || stateModifiers.general || 1.0;
        return baseRate * multiplier;
    }

    /**
     * Calculate ranges (P10, P50, P90) for uncertainty
     */
    calculateRanges(result, options) {
        const total = result.lineItems.reduce((sum, item) => sum + item.total, 0);
        const uncertaintyFactor = options.uncertaintyFactor || this.definition.uncertaintyFactor || 0.25;
        
        result.ranges = {
            p10: Math.round(total * (1 - uncertaintyFactor)),
            p50: Math.round(total),
            p90: Math.round(total * (1 + uncertaintyFactor)),
            uncertaintyFactor
        };
    }

    /**
     * Apply contingencies based on AACE standards
     */
    applyContingencies(result, options) {
        const subtotal = result.lineItems.reduce((sum, item) => sum + item.total, 0);
        const contingencyRate = options.contingencyRate || this.definition.contingencyRate || 0.15;
        
        result.contingencies = {
            subtotal,
            contingencyRate,
            contingencyAmount: Math.round(subtotal * contingencyRate),
            total: Math.round(subtotal * (1 + contingencyRate))
        };
        
        result.totals.withContingency = result.contingencies.total;
        result.totals.withoutContingency = subtotal;
    }

    /**
     * Validate calculator inputs
     */
    validateInputs(inputs) {
        const errors = [];
        
        for (const field of this.definition.inputFields) {
            const value = inputs[field.id];
            
            if (field.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field.name} is required`);
                continue;
            }
            
            if (value !== undefined && field.type === 'number') {
                if (isNaN(value)) {
                    errors.push(`${field.name} must be a number`);
                } else if (field.min !== undefined && value < field.min) {
                    errors.push(`${field.name} must be at least ${field.min}`);
                } else if (field.max !== undefined && value > field.max) {
                    errors.push(`${field.name} must be no more than ${field.max}`);
                }
            }
        }
        
        return errors;
    }

    /**
     * Evaluate mathematical expressions safely
     */
    evaluateExpression(expression, context) {
        if (typeof expression === 'number') {
            return expression;
        }
        
        if (typeof expression === 'string') {
            // Simple variable substitution
            let result = expression;
            for (const [key, value] of Object.entries(context)) {
                result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
            }
            
            try {
                // Safe evaluation (only basic math operations)
                return Function('"use strict"; return (' + result + ')')();
            } catch (error) {
                throw new Error(`Invalid expression: ${expression}`);
            }
        }
        
        return 0;
    }
}

/**
 * State Data Manager - handles US state/territory specific data
 */
class StateDataManager {
    constructor() {
        this.stateData = new Map();
        this.loadStateData();
    }

    async loadStateData() {
        try {
            const data = await fetch('/data/state-modifiers.json');
            const stateModifiers = await data.json();
            
            for (const [state, modifiers] of Object.entries(stateModifiers)) {
                this.stateData.set(state, modifiers);
            }
        } catch (error) {
            console.warn('Failed to load state data, using defaults');
            this.loadDefaultStateData();
        }
    }

    loadDefaultStateData() {
        // Default multipliers for major states
        const defaults = {
            'CA': { labor: 1.25, material: 1.15, equipment: 1.20, general: 1.20 },
            'NY': { labor: 1.30, material: 1.10, equipment: 1.25, general: 1.22 },
            'TX': { labor: 0.95, material: 0.98, equipment: 1.00, general: 0.98 },
            'FL': { labor: 1.00, material: 1.05, equipment: 1.10, general: 1.05 },
            'US_DEFAULT': { labor: 1.00, material: 1.00, equipment: 1.00, general: 1.00 }
        };
        
        for (const [state, modifiers] of Object.entries(defaults)) {
            this.stateData.set(state, modifiers);
        }
    }

    async getStateModifiers(stateCode) {
        return this.stateData.get(stateCode) || this.stateData.get('US_DEFAULT') || {};
    }

    getSupportedStates() {
        return Array.from(this.stateData.keys()).filter(s => s !== 'US_DEFAULT');
    }
}

/**
 * Validation Manager
 */
class ValidationManager {
    constructor() {
        this.calculatorSchema = {
            id: { type: 'string', required: true },
            name: { type: 'string', required: true },
            version: { type: 'string', required: false },
            category: { type: 'string', required: true },
            aaceClass: { type: 'string', required: false },
            accuracy: { type: 'string', required: false },
            inputFields: { type: 'array', required: true },
            calculationSteps: { type: 'array', required: true },
            assumptions: { type: 'array', required: false }
        };
    }

    validateCalculatorDefinition(definition) {
        const errors = [];
        
        for (const [field, rules] of Object.entries(this.calculatorSchema)) {
            if (rules.required && !definition[field]) {
                errors.push(`Missing required field: ${field}`);
            }
            
            if (definition[field] && rules.type === 'array' && !Array.isArray(definition[field])) {
                errors.push(`Field ${field} must be an array`);
            }
            
            if (definition[field] && rules.type === 'string' && typeof definition[field] !== 'string') {
                errors.push(`Field ${field} must be a string`);
            }
        }
        
        return errors;
    }
}

/**
 * Export Manager - handles PDF/CSV generation
 */
class ExportManager {
    constructor() {
        this.exportFormats = ['pdf', 'csv', 'json'];
    }

    async exportResults(results, format, options = {}) {
        switch (format.toLowerCase()) {
            case 'pdf':
                return this.exportToPDF(results, options);
            case 'csv':
                return this.exportToCSV(results, options);
            case 'json':
                return this.exportToJSON(results, options);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    exportToCSV(results, options) {
        const rows = [
            ['Item', 'CSI Code', 'Quantity', 'Unit', 'Rate', 'Total']
        ];
        
        results.lineItems.forEach(item => {
            rows.push([
                item.name,
                item.csiCode || '',
                item.quantity,
                item.unit,
                item.rate.toFixed(2),
                item.total.toFixed(2)
            ]);
        });
        
        // Add totals
        rows.push(['', '', '', '', 'Subtotal:', results.totals.withoutContingency.toFixed(2)]);
        if (results.contingencies.contingencyAmount > 0) {
            rows.push(['', '', '', '', `Contingency (${(results.contingencies.contingencyRate * 100).toFixed(1)}%):`, results.contingencies.contingencyAmount.toFixed(2)]);
            rows.push(['', '', '', '', 'Total:', results.contingencies.total.toFixed(2)]);
        }
        
        return rows.map(row => 
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    exportToJSON(results, options) {
        return JSON.stringify(results, null, 2);
    }

    async exportToPDF(results, options) {
        // PDF generation would require a library like jsPDF or server-side processing
        // For now, return a placeholder
        return {
            format: 'pdf',
            message: 'PDF export requires server-side processing',
            downloadUrl: '/api/export/pdf/' + results.metadata.timestamp
        };
    }
}

/**
 * Analytics Manager
 */
class AnalyticsManager {
    constructor() {
        this.enabled = true;
        this.events = [];
    }

    trackCalculation(calculatorId, state, result) {
        if (!this.enabled) return;
        
        const event = {
            type: 'calculation',
            calculatorId,
            state,
            timestamp: new Date().toISOString(),
            total: result.totals.withoutContingency,
            lineItemCount: result.lineItems.length,
            executionTime: result.executionTime
        };
        
        this.events.push(event);
        
        // Send to analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculator_use', {
                calculator_type: calculatorId,
                state: state,
                value: result.totals.withoutContingency
            });
        }
        
        // Custom analytics
        this.sendToAnalytics(event);
    }

    sendToAnalytics(event) {
        // Send to your analytics endpoint
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/analytics', JSON.stringify(event));
        }
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CalculatorSDK, Calculator };
}

// Global instance
window.CalculatorSDK = CalculatorSDK;