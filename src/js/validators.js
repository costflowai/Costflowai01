/**
 * CostFlowAI Input Validators
 * Professional validation system for all calculator inputs
 */

class InputValidator {
  constructor() {
    this.errors = new Map();
    this.validators = new Map();
    this.setupDefaultValidators();
  }

  setupDefaultValidators() {
    // Number validators
    this.validators.set('number', (value, options = {}) => {
      const num = parseFloat(String(value).replace(/,/g, ''));
      if (isNaN(num)) return { valid: false, message: 'Must be a valid number' };
      if (options.min !== undefined && num < options.min) {
        return { valid: false, message: `Must be at least ${options.min}` };
      }
      if (options.max !== undefined && num > options.max) {
        return { valid: false, message: `Must be no more than ${options.max}` };
      }
      return { valid: true, value: num };
    });

    // Integer validators
    this.validators.set('integer', (value, options = {}) => {
      const num = parseInt(String(value).replace(/,/g, ''));
      if (isNaN(num) || !Number.isInteger(num)) {
        return { valid: false, message: 'Must be a whole number' };
      }
      if (options.min !== undefined && num < options.min) {
        return { valid: false, message: `Must be at least ${options.min}` };
      }
      if (options.max !== undefined && num > options.max) {
        return { valid: false, message: `Must be no more than ${options.max}` };
      }
      return { valid: true, value: num };
    });

    // Feet and inches validator
    this.validators.set('feet-inches', (value, options = {}) => {
      const str = String(value).trim();
      const feetInchesRegex = /^(\d+)(?:'|ft|feet)?\s*(\d+(?:\.\d+)?)?(?:"|in|inches)?$/i;
      const match = str.match(feetInchesRegex);
      
      if (!match) {
        return { valid: false, message: 'Enter as feet and inches (e.g., "10\'6" or "10ft 6in")' };
      }
      
      const feet = parseInt(match[1]) || 0;
      const inches = parseFloat(match[2]) || 0;
      
      if (inches >= 12) {
        return { valid: false, message: 'Inches must be less than 12' };
      }
      
      const totalInches = feet * 12 + inches;
      const totalFeet = totalInches / 12;
      
      if (options.min !== undefined && totalFeet < options.min) {
        return { valid: false, message: `Must be at least ${options.min} feet` };
      }
      if (options.max !== undefined && totalFeet > options.max) {
        return { valid: false, message: `Must be no more than ${options.max} feet` };
      }
      
      return { valid: true, value: totalFeet, display: `${feet}'${inches > 0 ? inches.toString() : ''}"` };
    });

    // Percentage validator
    this.validators.set('percentage', (value, options = {}) => {
      const num = parseFloat(String(value).replace(/%/g, ''));
      if (isNaN(num)) return { valid: false, message: 'Must be a valid percentage' };
      if (num < 0 || num > 100) {
        return { valid: false, message: 'Must be between 0% and 100%' };
      }
      return { valid: true, value: num / 100 };
    });

    // Email validator
    this.validators.set('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { valid: false, message: 'Must be a valid email address' };
      }
      return { valid: true, value };
    });

    // Required field validator
    this.validators.set('required', (value) => {
      if (!value || String(value).trim() === '') {
        return { valid: false, message: 'This field is required' };
      }
      return { valid: true, value };
    });

    // Range validator
    this.validators.set('range', (value, options = {}) => {
      const num = parseFloat(String(value).replace(/,/g, ''));
      if (isNaN(num)) return { valid: false, message: 'Must be a valid number' };
      
      const min = options.min || 0;
      const max = options.max || Infinity;
      
      if (num < min || num > max) {
        return { 
          valid: false, 
          message: `Must be between ${min.toLocaleString()} and ${max === Infinity ? 'unlimited' : max.toLocaleString()}` 
        };
      }
      
      return { valid: true, value: num };
    });
  }

  validate(fieldName, value, rules = []) {
    this.errors.delete(fieldName);
    
    for (const rule of rules) {
      const validator = this.validators.get(rule.type);
      if (!validator) continue;
      
      const result = validator(value, rule.options || {});
      if (!result.valid) {
        this.errors.set(fieldName, result.message);
        return { valid: false, message: result.message };
      }
      
      // Update value if validator returned a processed value
      if (result.value !== undefined) {
        value = result.value;
      }
    }
    
    return { valid: true, value };
  }

  validateField(element, rules = []) {
    const fieldName = element.name || element.id || 'field';
    const value = element.type === 'checkbox' ? element.checked : element.value;
    
    const result = this.validate(fieldName, value, rules);
    
    // Update UI based on validation result
    this.updateFieldUI(element, result.valid, result.message);
    
    return result;
  }

  updateFieldUI(element, isValid, message) {
    // Remove existing error styling
    element.classList.remove('error');
    element.style.borderColor = '';
    
    // Remove existing error message
    const existingError = element.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    
    if (!isValid) {
      // Add error styling
      element.classList.add('error');
      element.style.borderColor = '#ef4444';
      
      // Add error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.style.cssText = 'color: #ef4444; font-size: 14px; margin-top: 4px;';
      errorDiv.textContent = message;
      element.parentNode.appendChild(errorDiv);
    }
  }

  validateForm(form, fieldRules = {}) {
    let isValid = true;
    const formData = {};
    
    for (const [fieldName, rules] of Object.entries(fieldRules)) {
      const element = form.querySelector(`[name="${fieldName}"], [id="${fieldName}"]`);
      if (!element) continue;
      
      const result = this.validateField(element, rules);
      if (!result.valid) {
        isValid = false;
      } else {
        formData[fieldName] = result.value;
      }
    }
    
    return { isValid, formData };
  }

  clearErrors() {
    this.errors.clear();
    
    // Clear UI errors
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.error').forEach(element => {
      element.classList.remove('error');
      element.style.borderColor = '';
    });
  }

  hasErrors() {
    return this.errors.size > 0;
  }

  getErrors() {
    return Object.fromEntries(this.errors);
  }
}

// Create global validator instance
window.inputValidator = new InputValidator();

// Common validation rules for calculators
window.CalcValidationRules = {
  // Concrete calculator rules
  concrete: {
    'concrete-length': [{ type: 'number', options: { min: 0.1, max: 1000 } }],
    'concrete-width': [{ type: 'number', options: { min: 0.1, max: 1000 } }],
    'concrete-thickness': [{ type: 'number', options: { min: 1, max: 24 } }]
  },
  
  // Framing calculator rules
  framing: {
    'framing-length': [{ type: 'number', options: { min: 0.5, max: 500 } }],
    'framing-height': [{ type: 'number', options: { min: 4, max: 20 } }],
    'framing-spacing': [{ type: 'number', options: { min: 12, max: 24 } }],
    'framing-openings': [{ type: 'integer', options: { min: 0, max: 50 } }]
  },
  
  // Paint calculator rules
  paint: {
    'paint-wall-area': [{ type: 'number', options: { min: 1, max: 10000 } }],
    'paint-openings': [{ type: 'number', options: { min: 0, max: 5000 } }],
    'paint-coats': [{ type: 'integer', options: { min: 1, max: 5 } }]
  },
  
  // Drywall calculator rules
  drywall: {
    'drywall-length': [{ type: 'number', options: { min: 0.5, max: 100 } }],
    'drywall-width': [{ type: 'number', options: { min: 0.5, max: 100 } }],
    'drywall-height': [{ type: 'number', options: { min: 6, max: 20 } }],
    'drywall-doors': [{ type: 'integer', options: { min: 0, max: 20 } }],
    'drywall-windows': [{ type: 'integer', options: { min: 0, max: 20 } }]
  },
  
  // Electrical calculator rules
  electrical: {
    'elec-sqft': [{ type: 'number', options: { min: 100, max: 100000 } }],
    'elec-units': [{ type: 'integer', options: { min: 1, max: 100 } }]
  },
  
  // HVAC calculator rules
  hvac: {
    'hvac-sqft': [{ type: 'number', options: { min: 100, max: 100000 } }],
    'hvac-ceiling-height': [{ type: 'number', options: { min: 6, max: 20 } }],
    'hvac-windows': [{ type: 'integer', options: { min: 0, max: 100 } }]
  }
};

// Enhanced real-time validation system
document.addEventListener('DOMContentLoaded', () => {
  // Real-time input cleaning for number fields
  document.addEventListener('input', (e) => {
    if (e.target.matches('input[type="number"]')) {
      // Clean input while typing
      let value = e.target.value;
      value = value.replace(/[^0-9.]/g, ''); // Remove non-numeric except decimal
      
      // Prevent multiple decimal points
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      if (e.target.value !== value) {
        e.target.value = value;
      }
      
      // Clear previous error styling if input is now valid
      if (value && !isNaN(value) && parseFloat(value) > 0) {
        e.target.classList.remove('error', 'invalid');
        clearFieldError(e.target);
      }
    }
  });

  // Validation on blur (focus leave)
  document.addEventListener('blur', (e) => {
    if (e.target.matches('input, select, textarea')) {
      const section = e.target.closest('[data-calc]');
      if (!section) return;
      
      const calcType = section.dataset.calc;
      const fieldName = e.target.name || e.target.id;
      
      // Custom validation for number inputs
      if (e.target.type === 'number' || e.target.matches('[type="number"]')) {
        validateNumberInput(e.target);
      }
      
      // Rule-based validation
      if (window.CalcValidationRules[calcType] && window.CalcValidationRules[calcType][fieldName]) {
        window.inputValidator.validateField(e.target, window.CalcValidationRules[calcType][fieldName]);
      }
    }
  });

  // Prevent form submission with invalid data
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-action="calculate"]')) {
      const section = e.target.closest('[data-calc]');
      if (!section) return;
      
      const inputs = section.querySelectorAll('input[required], input[type="number"]');
      let hasErrors = false;
      
      inputs.forEach(input => {
        if (input.type === 'number' || input.matches('[type="number"]')) {
          if (!validateNumberInput(input)) {
            hasErrors = true;
          }
        }
      });
      
      if (hasErrors) {
        e.preventDefault();
        e.stopPropagation();
        showToast('Please correct the highlighted errors before calculating', 'error');
        return false;
      }
    }
  });
});

// Enhanced number input validation
function validateNumberInput(input) {
  const value = input.value.trim();
  const min = parseFloat(input.getAttribute('min')) || 0;
  const max = parseFloat(input.getAttribute('max')) || Infinity;
  
  // Clear previous errors
  input.classList.remove('error', 'invalid');
  clearFieldError(input);
  
  if (!value) {
    if (input.required || input.hasAttribute('required')) {
      showFieldError(input, 'This field is required');
      return false;
    }
    return true;
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    showFieldError(input, 'Please enter a valid number');
    return false;
  }
  
  if (num < min) {
    showFieldError(input, `Value must be at least ${min.toLocaleString()}`);
    return false;
  }
  
  if (num > max) {
    showFieldError(input, `Value must be no more than ${max.toLocaleString()}`);
    return false;
  }
  
  if (num <= 0 && min >= 0) {
    showFieldError(input, 'Value must be greater than zero');
    return false;
  }
  
  return true;
}

// Show field-specific error message
function showFieldError(field, message) {
  clearFieldError(field); // Remove any existing error
  
  field.classList.add('error', 'invalid');
  field.setAttribute('aria-invalid', 'true');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 4px; animation: fadeIn 0.3s ease;';
  errorDiv.textContent = message;
  
  // Insert after the field or its parent container
  const container = field.closest('.input-group') || field.parentElement;
  container.appendChild(errorDiv);
  
  // Auto-remove after 10 seconds
  setTimeout(() => clearFieldError(field), 10000);
}

// Clear field error message
function clearFieldError(field) {
  field.classList.remove('error', 'invalid');
  field.setAttribute('aria-invalid', 'false');
  
  const container = field.closest('.input-group') || field.parentElement;
  const errorMessages = container.querySelectorAll('.field-error');
  errorMessages.forEach(el => el.remove());
}

// Simple toast notification (fallback if exportUtils not available)
function showToast(message, type = 'error') {
  if (window.exportUtils && window.exportUtils.showToast) {
    window.exportUtils.showToast(message, type);
  } else {
    // Fallback toast
    alert(message);
  }
}

// Export for use in other modules
window.InputValidator = InputValidator;
