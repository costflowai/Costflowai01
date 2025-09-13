/**
 * CostFlowAI Display Formatting System
 * Consistent and professional number/currency display across all calculators
 */

(function() {
  'use strict';
  
  /**
   * Professional Display Formatter
   * Handles currency, numbers, percentages, and units with proper formatting
   */
  class DisplayFormatter {
    constructor(options = {}) {
      this.locale = options.locale || 'en-US';
      this.currency = options.currency || 'USD';
      this.decimalPlaces = {
        currency: options.currencyDecimals || 0,
        percentage: options.percentageDecimals || 1,
        number: options.numberDecimals || 2,
        unit: options.unitDecimals || 2
      };
    }
    
    /**
     * Format currency with proper locale and symbol
     */
    formatCurrency(value, options = {}) {
      if (value === null || value === undefined || isNaN(value)) {
        return '$0';
      }
      
      const num = parseFloat(value);
      const decimals = options.decimals !== undefined ? options.decimals : this.decimalPlaces.currency;
      
      try {
        // Use Intl.NumberFormat for proper currency formatting
        if (window.Intl && window.Intl.NumberFormat) {
          return new Intl.NumberFormat(this.locale, {
            style: 'currency',
            currency: this.currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }).format(num);
        }
      } catch (e) {
        // Fallback for older browsers
      }
      
      // Fallback formatting
      const formatted = this.formatNumber(Math.abs(num), { decimals });
      return (num < 0 ? '-$' : '$') + formatted;
    }
    
    /**
     * Format numbers with proper thousands separators
     */
    formatNumber(value, options = {}) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0';
      }
      
      const num = parseFloat(value);
      const decimals = options.decimals !== undefined ? options.decimals : this.decimalPlaces.number;
      
      try {
        // Use Intl.NumberFormat for proper number formatting
        if (window.Intl && window.Intl.NumberFormat) {
          return new Intl.NumberFormat(this.locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }).format(num);
        }
      } catch (e) {
        // Fallback for older browsers
      }
      
      // Fallback: manual formatting
      const fixed = num.toFixed(decimals);
      const parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }
    
    /**
     * Format percentages
     */
    formatPercentage(value, options = {}) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0%';
      }
      
      const num = parseFloat(value);
      const decimals = options.decimals !== undefined ? options.decimals : this.decimalPlaces.percentage;
      
      // Convert to percentage if needed
      const percentage = options.isDecimal === false ? num : num * 100;
      
      return this.formatNumber(percentage, { decimals }) + '%';
    }
    
    /**
     * Format units with proper precision
     */
    formatUnit(value, unit, options = {}) {
      if (value === null || value === undefined || isNaN(value)) {
        return `0 ${unit}`;
      }
      
      const num = parseFloat(value);
      const decimals = options.decimals !== undefined ? options.decimals : this.decimalPlaces.unit;
      
      const formatted = this.formatNumber(num, { decimals });
      return `${formatted} ${unit}`;
    }
    
    /**
     * Smart formatting based on value type and magnitude
     */
    formatSmart(value, type = 'auto', options = {}) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0';
      }
      
      const num = parseFloat(value);
      
      // Auto-detect type if not specified
      if (type === 'auto') {
        if (options.isCurrency || (num >= 100 && Number.isInteger(num))) {
          type = 'currency';
        } else if (num < 1 && num > 0) {
          type = 'percentage';
        } else {
          type = 'number';
        }
      }
      
      switch (type) {
        case 'currency':
          return this.formatCurrency(num, options);
        case 'percentage':
          return this.formatPercentage(num, options);
        case 'number':
          return this.formatNumber(num, options);
        default:
          return this.formatNumber(num, options);
      }
    }
    
    /**
     * Format range (e.g., "$1,000 - $5,000")
     */
    formatRange(min, max, type = 'currency', options = {}) {
      const formattedMin = this.formatSmart(min, type, options);
      const formattedMax = this.formatSmart(max, type, options);
      
      if (min === max) {
        return formattedMin;
      }
      
      return `${formattedMin} - ${formattedMax}`;
    }
    
    /**
     * Format large numbers with abbreviations (K, M, B)
     */
    formatAbbreviated(value, options = {}) {
      if (value === null || value === undefined || isNaN(value)) {
        return '$0';
      }
      
      const num = Math.abs(parseFloat(value));
      const sign = value < 0 ? '-' : '';
      const isCurrency = options.currency !== false;
      const prefix = isCurrency ? '$' : '';
      
      if (num >= 1000000000) {
        return sign + prefix + (num / 1000000000).toFixed(1) + 'B';
      } else if (num >= 1000000) {
        return sign + prefix + (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return sign + prefix + (num / 1000).toFixed(1) + 'K';
      } else {
        return sign + prefix + num.toFixed(0);
      }
    }
    
    /**
     * Format time duration
     */
    formatDuration(hours, options = {}) {
      if (hours === null || hours === undefined || isNaN(hours)) {
        return '0 hours';
      }
      
      const totalHours = parseFloat(hours);
      
      if (totalHours < 1) {
        const minutes = Math.round(totalHours * 60);
        return `${minutes} min${minutes !== 1 ? 's' : ''}`;
      } else if (totalHours < 24) {
        const wholeHours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - wholeHours) * 60);
        if (minutes === 0) {
          return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
        } else {
          return `${wholeHours}h ${minutes}m`;
        }
      } else {
        const days = Math.floor(totalHours / 24);
        const remainingHours = Math.round(totalHours % 24);
        if (remainingHours === 0) {
          return `${days} day${days !== 1 ? 's' : ''}`;
        } else {
          return `${days}d ${remainingHours}h`;
        }
      }
    }
    
    /**
     * Format area measurements
     */
    formatArea(sqft, options = {}) {
      if (sqft === null || sqft === undefined || isNaN(sqft)) {
        return '0 sq ft';
      }
      
      const area = parseFloat(sqft);
      const unit = options.unit || 'sq ft';
      
      return this.formatUnit(area, unit, { decimals: 0 });
    }
    
    /**
     * Format volume measurements
     */
    formatVolume(volume, unit = 'cu ft', options = {}) {
      if (volume === null || volume === undefined || isNaN(volume)) {
        return `0 ${unit}`;
      }
      
      return this.formatUnit(parseFloat(volume), unit, { decimals: 2 });
    }
    
    /**
     * Format measurements with units
     */
    formatMeasurement(value, unit, options = {}) {
      if (value === null || value === undefined || isNaN(value)) {
        return `0 ${unit}`;
      }
      
      const num = parseFloat(value);
      
      // Special handling for common units
      switch (unit.toLowerCase()) {
        case 'ft':
        case 'feet':
          return this.formatUnit(num, 'ft', { decimals: 1 });
        case 'in':
        case 'inches':
          return this.formatUnit(num, 'in', { decimals: 2 });
        case 'sq ft':
        case 'sqft':
          return this.formatArea(num, options);
        case 'cu ft':
        case 'cuft':
          return this.formatVolume(num, 'cu ft', options);
        case 'cy':
        case 'cubic yards':
          return this.formatVolume(num, 'CY', options);
        case 'lf':
        case 'linear feet':
          return this.formatUnit(num, 'LF', { decimals: 1 });
        default:
          return this.formatUnit(num, unit, options);
      }
    }
  }
  
  /**
   * Display Update Manager
   * Handles updating DOM elements with formatted values
   */
  class DisplayUpdateManager {
    constructor(formatter) {
      this.formatter = formatter || new DisplayFormatter();
    }
    
    /**
     * Update element with formatted value
     */
    updateElement(selector, value, type = 'auto', options = {}) {
      const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!element) {
        console.warn('Display element not found:', selector);
        return;
      }
      
      let formatted;
      
      switch (type) {
        case 'currency':
          formatted = this.formatter.formatCurrency(value, options);
          break;
        case 'percentage':
          formatted = this.formatter.formatPercentage(value, options);
          break;
        case 'number':
          formatted = this.formatter.formatNumber(value, options);
          break;
        case 'unit':
          formatted = this.formatter.formatUnit(value, options.unit || '', options);
          break;
        case 'measurement':
          formatted = this.formatter.formatMeasurement(value, options.unit || '', options);
          break;
        case 'duration':
          formatted = this.formatter.formatDuration(value, options);
          break;
        case 'abbreviated':
          formatted = this.formatter.formatAbbreviated(value, options);
          break;
        default:
          formatted = this.formatter.formatSmart(value, type, options);
      }
      
      // Update element content
      if (element.tagName === 'INPUT') {
        element.value = formatted;
      } else {
        element.textContent = formatted;
      }
      
      // Add formatting attributes for styling
      element.setAttribute('data-formatted-value', formatted);
      element.setAttribute('data-raw-value', value);
      element.setAttribute('data-format-type', type);
    }
    
    /**
     * Update multiple elements at once
     */
    updateElements(updates) {
      updates.forEach(update => {
        this.updateElement(update.selector, update.value, update.type, update.options);
      });
    }
    
    /**
     * Animate number changes
     */
    animateValue(selector, fromValue, toValue, type = 'auto', options = {}) {
      const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (!element) return;
      
      const duration = options.duration || 1000;
      const startTime = performance.now();
      const from = parseFloat(fromValue) || 0;
      const to = parseFloat(toValue) || 0;
      const difference = to - from;
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = from + (difference * easedProgress);
        
        this.updateElement(element, currentValue, type, options);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Ensure final value is exact
          this.updateElement(element, to, type, options);
          
          // Callback when animation complete
          if (options.onComplete) {
            options.onComplete();
          }
        }
      };
      
      requestAnimationFrame(animate);
    }
  }
  
  // Create global instances
  const globalFormatter = new DisplayFormatter();
  const globalUpdater = new DisplayUpdateManager(globalFormatter);
  
  // Export to window for global access
  window.DisplayFormatter = DisplayFormatter;
  window.DisplayUpdateManager = DisplayUpdateManager;
  window.displayFormatter = globalFormatter;
  window.displayUpdater = globalUpdater;
  
  // Legacy compatibility functions
  window.formatCurrency = (value, options) => globalFormatter.formatCurrency(value, options);
  window.formatNumber = (value, options) => globalFormatter.formatNumber(value, options);
  window.formatPercentage = (value, options) => globalFormatter.formatPercentage(value, options);
  window.formatUnit = (value, unit, options) => globalFormatter.formatUnit(value, unit, options);
  window.updateDisplay = (selector, value, type, options) => globalUpdater.updateElement(selector, value, type, options);
  window.animateDisplay = (selector, from, to, type, options) => globalUpdater.animateValue(selector, from, to, type, options);
  
  console.log('Display formatting system loaded');
})();