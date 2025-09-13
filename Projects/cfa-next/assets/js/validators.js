/**
 * Validator Utilities
 * Handles number parsing, validation, and field marking for calculators
 */

class ValidatorUtils {
    constructor() {
        this.locale = navigator.language || 'en-US';
        this.decimalSeparator = this.getDecimalSeparator();
    }

    /**
     * Get the decimal separator for the current locale
     * @returns {string} Decimal separator ('.' or ',')
     */
    getDecimalSeparator() {
        const testNumber = 1.1;
        return testNumber.toLocaleString(this.locale).charAt(1);
    }

    /**
     * Parse feet and inches input (e.g., "8'6\"" or "8' 6\"" or "8.5")
     * @param {string} input - Input string
     * @returns {number} Value in feet
     */
    parseFeetInches(input) {
        if (!input || typeof input !== 'string') {
            return null;
        }

        input = input.trim();

        // Handle decimal feet (e.g., "8.5")
        if (/^\d+(\.\d+)?$/.test(input)) {
            return this.parseLocaleNumber(input);
        }

        // Handle feet and inches (e.g., "8'6\"", "8' 6\"", "8ft 6in")
        const feetInchesRegex = /^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)\s*(?:(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?)?$/i;
        const match = input.match(feetInchesRegex);

        if (match) {
            const feet = parseFloat(match[1]) || 0;
            const inches = parseFloat(match[2]) || 0;
            return feet + (inches / 12);
        }

        // Handle inches only (e.g., "102\"", "102in")
        const inchesOnlyRegex = /^(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)$/i;
        const inchMatch = input.match(inchesOnlyRegex);

        if (inchMatch) {
            return parseFloat(inchMatch[1]) / 12;
        }

        return null;
    }

    /**
     * Parse number with locale-specific decimal separator
     * @param {string} input - Input string
     * @returns {number|null} Parsed number or null if invalid
     */
    parseLocaleNumber(input) {
        if (!input || typeof input !== 'string') {
            return null;
        }

        // Replace locale decimal separator with standard dot
        const normalized = input.trim().replace(',', '.');

        // Remove any non-numeric characters except decimal point and minus
        const cleaned = normalized.replace(/[^\d.-]/g, '');

        const number = parseFloat(cleaned);
        return isNaN(number) ? null : number;
    }

    /**
     * Validate number within range
     * @param {number} value - Number to validate
     * @param {number} min - Minimum value (inclusive)
     * @param {number} max - Maximum value (inclusive)
     * @returns {boolean} True if valid
     */
    validateRange(value, min = 0, max = Infinity) {
        return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
    }

    /**
     * Validate step increment
     * @param {number} value - Number to validate
     * @param {number} step - Step increment
     * @returns {boolean} True if valid step
     */
    validateStep(value, step) {
        if (!step || step <= 0) return true;
        return Math.abs((value * 100) % (step * 100)) < 0.01;
    }

    /**
     * Validate integer
     * @param {number} value - Number to validate
     * @returns {boolean} True if integer
     */
    validateInteger(value) {
        return typeof value === 'number' && !isNaN(value) && Number.isInteger(value);
    }

    /**
     * Validate required field
     * @param {string|number} value - Value to validate
     * @returns {boolean} True if not empty/null/undefined
     */
    validateRequired(value) {
        return value !== null && value !== undefined && value !== '';
    }

    /**
     * Mark field as invalid with error message
     * @param {HTMLElement} field - Input field element
     * @param {string} message - Error message
     */
    markFieldInvalid(field, message) {
        field.classList.add('invalid');
        field.setAttribute('aria-invalid', 'true');

        // Create or update error message
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    /**
     * Mark field as valid and remove error message
     * @param {HTMLElement} field - Input field element
     */
    markFieldValid(field) {
        field.classList.remove('invalid');
        field.setAttribute('aria-invalid', 'false');

        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Validate individual field based on its attributes
     * @param {HTMLElement} field - Input field element
     * @returns {boolean} True if valid
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id || 'Field';

        // Check required
        if (field.hasAttribute('required') && !this.validateRequired(value)) {
            this.markFieldInvalid(field, `${fieldName} is required`);
            return false;
        }

        // Skip further validation if empty and not required
        if (!value && !field.hasAttribute('required')) {
            this.markFieldValid(field);
            return true;
        }

        // Parse number (handle feet-inches if applicable)
        let numericValue;
        if (field.dataset.format === 'feet-inches') {
            numericValue = this.parseFeetInches(value);
        } else {
            numericValue = this.parseLocaleNumber(value);
        }

        if (numericValue === null) {
            this.markFieldInvalid(field, `${fieldName} must be a valid number`);
            return false;
        }

        // Check minimum
        const min = parseFloat(field.getAttribute('min'));
        if (!isNaN(min) && !this.validateRange(numericValue, min, Infinity)) {
            this.markFieldInvalid(field, `${fieldName} must be at least ${min}`);
            return false;
        }

        // Check maximum
        const max = parseFloat(field.getAttribute('max'));
        if (!isNaN(max) && !this.validateRange(numericValue, -Infinity, max)) {
            this.markFieldInvalid(field, `${fieldName} must be no more than ${max}`);
            return false;
        }

        // Check step
        const step = parseFloat(field.getAttribute('step'));
        if (!isNaN(step) && !this.validateStep(numericValue, step)) {
            this.markFieldInvalid(field, `${fieldName} must be in increments of ${step}`);
            return false;
        }

        // Check integer requirement
        if (field.dataset.integer === 'true' && !this.validateInteger(numericValue)) {
            this.markFieldInvalid(field, `${fieldName} must be a whole number`);
            return false;
        }

        this.markFieldValid(field);
        return true;
    }

    /**
     * Validate all fields in a container
     * @param {HTMLElement} container - Container element
     * @returns {boolean} True if all fields are valid
     */
    validateContainer(container) {
        const fields = container.querySelectorAll('input[type="number"], input[type="text"], select');
        let allValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                allValid = false;
            }
        });

        return allValid;
    }

    /**
     * Get parsed numeric value from field
     * @param {HTMLElement} field - Input field
     * @returns {number|null} Parsed numeric value
     */
    getFieldValue(field) {
        const value = field.value.trim();

        if (!value) return null;

        if (field.dataset.format === 'feet-inches') {
            return this.parseFeetInches(value);
        }

        return this.parseLocaleNumber(value);
    }

    /**
     * Clear all validation errors in container
     * @param {HTMLElement} container - Container element
     */
    clearValidationErrors(container) {
        const invalidFields = container.querySelectorAll('.invalid');
        invalidFields.forEach(field => this.markFieldValid(field));

        const errorElements = container.querySelectorAll('.field-error');
        errorElements.forEach(error => error.style.display = 'none');
    }

    /**
     * Format number for display with locale
     * @param {number} value - Number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    formatNumber(value, decimals = 2) {
        return value.toLocaleString(this.locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    /**
     * Format currency for display
     * @param {number} value - Amount to format
     * @param {string} currency - Currency code (default: USD)
     * @returns {string} Formatted currency
     */
    formatCurrency(value, currency = 'USD') {
        return value.toLocaleString(this.locale, {
            style: 'currency',
            currency: currency
        });
    }
}

// Initialize validator utils
const validatorUtils = new ValidatorUtils();

// Export for global use
window.validatorUtils = validatorUtils;

// Add real-time validation to forms when they're loaded
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('.calc-form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[type="number"], input[type="text"]');

        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validatorUtils.validateField(this);
            });

            input.addEventListener('input', function() {
                // Clear error on input change, but don't validate until blur
                if (this.classList.contains('invalid')) {
                    validatorUtils.markFieldValid(this);
                }
            });
        });
    });
});