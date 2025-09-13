/**
 * Comprehensive Form Validation System
 * Provides secure input validation and sanitization
 * @version 1.0.0
 */

class FormValidator {
    
    constructor() {
        this.validators = new Map();
        this.errorStates = new Map();
        this.setupDefaultValidators();
        this.init();
    }
    
    /**
     * Initialize form validation system
     */
    init() {
        document.addEventListener('input', this.validateField.bind(this));
        document.addEventListener('blur', this.validateField.bind(this));
        document.addEventListener('submit', this.validateForm.bind(this));
    }
    
    /**
     * Setup default validation rules
     */
    setupDefaultValidators() {
        // Required field validator
        this.addValidator('required', (value) => {
            return value !== null && value !== undefined && String(value).trim() !== '';
        }, 'This field is required');
        
        // Number validation
        this.addValidator('number', (value) => {
            return !isNaN(parseFloat(value)) && isFinite(value);
        }, 'Must be a valid number');
        
        // Positive number validation
        this.addValidator('positive', (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0;
        }, 'Must be a positive number');
        
        // Range validation
        this.addValidator('range', (value, min, max) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= min && num <= max;
        }, (min, max) => `Must be between ${min} and ${max}`);
        
        // Email validation
        this.addValidator('email', (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        }, 'Must be a valid email address');
        
        // Phone validation
        this.addValidator('phone', (value) => {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
        }, 'Must be a valid phone number');
        
        // Dimension validation (for construction measurements)
        this.addValidator('dimension', (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num > 0 && num <= 10000; // Max 10,000 units
        }, 'Must be a valid dimension (1-10,000)');
        
        // Cost validation
        this.addValidator('cost', (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0 && num <= 10000000; // Max $10M
        }, 'Must be a valid cost amount');
        
        // Percentage validation
        this.addValidator('percentage', (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0 && num <= 100;
        }, 'Must be between 0 and 100 percent');
        
        // Safe string validation (XSS prevention)
        this.addValidator('safeString', (value) => {
            const dangerousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe/gi,
                /<object/gi,
                /<embed/gi
            ];
            
            return !dangerousPatterns.some(pattern => pattern.test(value));
        }, 'Contains invalid characters');
    }
    
    /**
     * Add custom validator
     * @param {string} name - Validator name
     * @param {Function} validator - Validation function
     * @param {string|Function} message - Error message or message generator
     */
    addValidator(name, validator, message) {
        this.validators.set(name, { validator, message });
    }
    
    /**
     * Validate individual field
     * @param {Event} event - Input event
     */
    validateField(event) {
        const field = event.target;
        const fieldName = field.name || field.id;
        
        if (!fieldName || !field.hasAttribute('data-validate')) {
            return;
        }
        
        try {
            // Clear previous errors
            this.clearFieldErrors(field);
            
            // Get validation rules
            const rules = this.parseValidationRules(field.getAttribute('data-validate'));
            const value = field.value;
            
            // Run validation
            const errors = this.runValidation(value, rules);
            
            if (errors.length > 0) {
                this.showFieldErrors(field, errors);
                this.errorStates.set(fieldName, errors);
                field.setAttribute('aria-invalid', 'true');
            } else {
                this.errorStates.delete(fieldName);
                field.setAttribute('aria-invalid', 'false');
            }
            
        } catch (error) {
            console.error('Field validation error:', error);
            this.showFieldErrors(field, ['Validation error occurred']);
        }
    }
    
    /**
     * Validate entire form
     * @param {Event} event - Submit event
     * @returns {boolean} Is form valid
     */
    validateForm(event) {
        const form = event.target;
        if (!form.tagName || form.tagName.toLowerCase() !== 'form') {
            return true;
        }
        
        const fields = form.querySelectorAll('[data-validate]');
        let isValid = true;
        
        fields.forEach(field => {
            const mockEvent = { target: field };
            this.validateField(mockEvent);
            
            if (this.errorStates.has(field.name || field.id)) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            event.preventDefault();
            this.focusFirstError(form);
            
            // Show form-level error message
            SecureDOM.showNotification(
                'Please correct the errors in the form before submitting',
                'error',
                5000
            );
        }
        
        return isValid;
    }
    
    /**
     * Parse validation rules from data attribute
     * @param {string} rulesString - Validation rules string
     * @returns {Array} Parsed rules
     */
    parseValidationRules(rulesString) {
        const rules = [];
        const ruleParts = rulesString.split('|');
        
        ruleParts.forEach(rule => {
            const [name, ...params] = rule.split(':');
            rules.push({
                name: name.trim(),
                params: params.length > 0 ? params[0].split(',').map(p => p.trim()) : []
            });
        });
        
        return rules;
    }
    
    /**
     * Run validation against rules
     * @param {any} value - Value to validate
     * @param {Array} rules - Validation rules
     * @returns {Array} Error messages
     */
    runValidation(value, rules) {
        const errors = [];
        
        rules.forEach(rule => {
            const validatorConfig = this.validators.get(rule.name);
            if (!validatorConfig) {
                console.warn(`Unknown validator: ${rule.name}`);
                return;
            }
            
            const { validator, message } = validatorConfig;
            
            // Skip other validations if field is empty and not required
            if (!rules.some(r => r.name === 'required') && 
                (value === '' || value === null || value === undefined)) {
                return;
            }
            
            try {
                const isValid = validator(value, ...rule.params);
                
                if (!isValid) {
                    const errorMessage = typeof message === 'function' 
                        ? message(...rule.params)
                        : message;
                    errors.push(errorMessage);
                }
            } catch (error) {
                console.error(`Validation error for rule ${rule.name}:`, error);
                errors.push('Validation error occurred');
            }
        });
        
        return errors;
    }
    
    /**
     * Clear field errors
     * @param {Element} field - Form field element
     */
    clearFieldErrors(field) {
        // Remove error classes
        field.classList.remove('error', 'invalid');
        
        // Remove error messages
        const errorContainer = field.parentNode.querySelector('.field-errors');
        if (errorContainer) {
            errorContainer.remove();
        }
        
        // Clear ARIA attributes
        field.removeAttribute('aria-describedby');
    }
    
    /**
     * Show field errors
     * @param {Element} field - Form field element
     * @param {Array} errors - Error messages
     */
    showFieldErrors(field, errors) {
        // Add error class
        field.classList.add('error', 'invalid');
        
        // Create error container
        const errorContainer = SecureDOM.createElement(field.parentNode, 'div', {
            className: 'field-errors',
            id: `${field.id || field.name}-errors`,
            style: {
                color: '#e53e3e',
                fontSize: '0.875rem',
                marginTop: '0.25rem'
            }
        });
        
        // Add error messages
        errors.forEach(error => {
            SecureDOM.createElement(errorContainer, 'div', {
                className: 'error-message'
            }, error);
        });
        
        // Set ARIA attributes
        field.setAttribute('aria-describedby', errorContainer.id);
    }
    
    /**
     * Focus first error field
     * @param {Element} form - Form element
     */
    focusFirstError(form) {
        const firstError = form.querySelector('.error, .invalid');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Sanitize input value
     * @param {string} value - Input value
     * @returns {string} Sanitized value
     */
    sanitizeInput(value) {
        if (typeof value !== 'string') {
            value = String(value || '');
        }
        
        return value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    
    /**
     * Get all form errors
     * @param {Element} form - Form element
     * @returns {Object} Errors by field name
     */
    getFormErrors(form) {
        const errors = {};
        const fields = form.querySelectorAll('[data-validate]');
        
        fields.forEach(field => {
            const fieldName = field.name || field.id;
            if (this.errorStates.has(fieldName)) {
                errors[fieldName] = this.errorStates.get(fieldName);
            }
        });
        
        return errors;
    }
    
    /**
     * Validate calculator inputs specifically
     * @param {Object} inputs - Input values object
     * @param {string} calculatorType - Type of calculator
     * @returns {Object} Validation result
     */
    validateCalculatorInputs(inputs, calculatorType) {
        const errors = {};
        let isValid = true;
        
        // Common validation rules for all calculators
        const commonRules = {
            dimensions: ['required', 'positive', 'dimension'],
            costs: ['required', 'positive', 'cost'],
            percentages: ['required', 'percentage']
        };
        
        // Calculator-specific validation
        const calculatorRules = {
            concrete: {
                length: commonRules.dimensions,
                width: commonRules.dimensions,
                thickness: ['required', 'positive', 'range:1,24'], // 1-24 inches
                pricePerYard: commonRules.costs
            },
            framing: {
                length: commonRules.dimensions,
                height: ['required', 'positive', 'range:8,30'], // 8-30 feet
                studSpacing: ['required', 'positive', 'range:12,24'], // 12-24 inches
                lumberPrice: commonRules.costs
            },
            roofing: {
                length: commonRules.dimensions,
                width: commonRules.dimensions,
                pitch: ['required', 'positive', 'range:1,20'], // 1:12 to 20:12 pitch
                shinglePrice: commonRules.costs
            }
        };
        
        const rules = calculatorRules[calculatorType] || {};
        
        Object.entries(inputs).forEach(([field, value]) => {
            if (rules[field]) {
                const fieldErrors = this.runValidation(value, this.parseValidationRules(rules[field].join('|')));
                if (fieldErrors.length > 0) {
                    errors[field] = fieldErrors;
                    isValid = false;
                }
            }
        });
        
        return { isValid, errors };
    }
}

// Initialize form validation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.formValidator = new FormValidator();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}