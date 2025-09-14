/**
 * CostFlowAI Input Validators
 * Provides comprehensive input validation with inline error messages
 */

(function(window) {
    'use strict';

    const Validators = {
        // Validation rules
        rules: {
            required: (value) => value !== null && value !== undefined && value !== '',
            min: (value, min) => parseFloat(value) >= min,
            max: (value, max) => parseFloat(value) <= max,
            number: (value) => !isNaN(parseFloat(value)) && isFinite(value),
            positive: (value) => parseFloat(value) > 0
        },

        // Parse feet-inches format
        parseFeetInches: function(value) {
            if (!value) return 0;
            value = value.toString().trim();
            const ftInPattern = /^(\d+(?:\.\d+)?)'?\s*(?:-?\s*)?(\d+(?:\.\d+)?)?(?:"|'')?$/;
            const match = value.match(ftInPattern);
            
            if (match) {
                const feet = parseFloat(match[1]) || 0;
                const inches = parseFloat(match[2]) || 0;
                return feet + (inches / 12);
            }
            return parseFloat(value) || 0;
        },

        // Format number with commas
        formatNumber: function(value, decimals = 2) {
            if (value === null || value === undefined) return '';
            const num = parseFloat(value);
            if (isNaN(num)) return value;
            
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(num);
        },

        // Parse number with comma removal
        parseNumber: function(value) {
            if (!value) return 0;
            const cleaned = value.toString().replace(/[,\s]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? 0 : num;
        },

        // Validate a single input
        validateInput: function(input, rules) {
            const value = input.value;
            const errors = [];
            
            for (const [rule, param] of Object.entries(rules)) {
                if (rule === 'required' && param && !this.rules.required(value)) {
                    errors.push('This field is required');
                }
                else if (rule === 'min' && !this.rules.min(value, param)) {
                    errors.push(`Minimum value is ${param}`);
                }
                else if (rule === 'max' && !this.rules.max(value, param)) {
                    errors.push(`Maximum value is ${param}`);
                }
                else if (rule === 'number' && param && !this.rules.number(value)) {
                    errors.push('Enter a valid number');
                }
                else if (rule === 'positive' && param && !this.rules.positive(value)) {
                    errors.push('Value must be positive');
                }
            }
            
            return { valid: errors.length === 0, errors: errors };
        },

        // Show inline error message
        showError: function(input, message) {
            this.clearError(input);
            input.classList.add('error');
            
            const errorEl = document.createElement('div');
            errorEl.className = 'validation-error';
            errorEl.textContent = message;
            errorEl.setAttribute('role', 'alert');
            
            input.parentNode.insertBefore(errorEl, input.nextSibling);
        },

        // Clear error message
        clearError: function(input) {
            input.classList.remove('error');
            const errorEl = input.parentNode.querySelector('.validation-error');
            if (errorEl) errorEl.remove();
        },

        // Validate all inputs in a section
        validateSection: function(section) {
            const inputs = section.querySelectorAll('input[data-validate]');
            let allValid = true;
            
            inputs.forEach(input => {
                const rules = JSON.parse(input.dataset.validate || '{}');
                const result = this.validateInput(input, rules);
                
                if (!result.valid) {
                    this.showError(input, result.errors[0]);
                    allValid = false;
                } else {
                    this.clearError(input);
                }
            });
            
            return allValid;
        },

        // Enable/disable calculate button
        updateCalculateButton: function(section) {
            const button = section.querySelector('[data-action="calculate"]');
            if (!button) return;
            
            const isValid = this.validateSection(section);
            button.disabled = !isValid;
            button.classList.toggle('disabled', !isValid);
            button.setAttribute('aria-disabled', !isValid);
        },

        // Setup validation listeners
        setupValidation: function(section) {
            const inputs = section.querySelectorAll('input[data-validate]');
            
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    const rules = JSON.parse(input.dataset.validate || '{}');
                    const result = this.validateInput(input, rules);
                    
                    if (!result.valid) {
                        this.showError(input, result.errors[0]);
                    } else {
                        this.clearError(input);
                    }
                    this.updateCalculateButton(section);
                });
                
                input.addEventListener('input', () => {
                    if (input.classList.contains('error')) {
                        this.clearError(input);
                    }
                    this.updateCalculateButton(section);
                });
            });
            
            this.updateCalculateButton(section);
        },

        // Format currency
        formatCurrency: function(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        }
    };

    // Add validation CSS
    const style = document.createElement('style');
    style.textContent = `
        .validation-error {
            color: #dc2626;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
        input.error {
            border-color: #dc2626 !important;
            background-color: #fef2f2 !important;
        }
        button.disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);

    window.Validators = Validators;
})(window);