/**
 * Enhanced Calculator System v2.0
 * Modern, TypeScript-based calculator with real-time validation,
 * accessibility, and enterprise features
 */

interface CalculatorConfig {
  id: string;
  name: string;
  description: string;
  inputs: InputField[];
  outputs: OutputField[];
  calculations: CalculationMethod[];
  validation: ValidationRules;
  metadata: CalculatorMetadata;
}

interface InputField {
  id: string;
  label: string;
  type: 'number' | 'select' | 'text' | 'range' | 'checkbox';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  required: boolean;
  defaultValue?: any;
  options?: SelectOption[];
  validation?: FieldValidation;
  tooltip?: string;
  category?: string;
}

interface OutputField {
  id: string;
  label: string;
  type: 'currency' | 'number' | 'percentage' | 'text';
  unit?: string;
  precision?: number;
  format?: 'compact' | 'full';
  category?: string;
  description?: string;
}

interface CalculationMethod {
  id: string;
  name: string;
  formula: string;
  dependencies: string[];
  conditions?: CalculationCondition[];
}

interface ValidationRules {
  required: string[];
  ranges: { [key: string]: { min: number; max: number } };
  dependencies: { [key: string]: string[] };
  custom: CustomValidation[];
}

interface CalculatorMetadata {
  version: string;
  lastUpdated: string;
  author: string;
  accuracy: 'ROM' | 'Detailed' | 'Precise';
  complexity: 'Basic' | 'Intermediate' | 'Advanced';
  industries: string[];
  tags: string[];
}

class EnhancedCalculator {
  private config: CalculatorConfig;
  private inputs: Map<string, any> = new Map();
  private outputs: Map<string, any> = new Map();
  private errors: Map<string, string[]> = new Map();
  private listeners: Map<string, Function[]> = new Map();
  private history: CalculationHistory[] = [];
  private element: HTMLElement;
  private isCalculating: boolean = false;

  constructor(config: CalculatorConfig, containerSelector: string) {
    this.config = config;
    this.element = document.querySelector(containerSelector) as HTMLElement;
    
    if (!this.element) {
      throw new Error(`Calculator container not found: ${containerSelector}`);
    }
    
    this.initialize();
  }

  private initialize(): void {
    this.setupInputDefaults();
    this.render();
    this.attachEventListeners();
    this.performInitialCalculation();
    
    // Accessibility enhancements
    this.setupAccessibility();
    
    // Performance monitoring
    this.setupPerformanceMonitoring();
    
    console.log(`✅ Enhanced Calculator "${this.config.name}" initialized`);
  }

  private setupInputDefaults(): void {
    this.config.inputs.forEach(input => {
      if (input.defaultValue !== undefined) {
        this.inputs.set(input.id, input.defaultValue);
      }
    });
  }

  private render(): void {
    const template = this.createTemplate();
    this.element.innerHTML = template;
    
    // Apply modern styling
    this.element.classList.add('calculator-enhanced', 'glass-card');
    
    // Setup progressive enhancement
    this.setupProgressiveEnhancement();
  }

  private createTemplate(): string {
    return `
      <div class="calculator-header">
        <h2 class="calculator-title text-gradient">${this.config.name}</h2>
        <p class="calculator-description">${this.config.description}</p>
        <div class="calculator-metadata">
          <span class="accuracy-badge badge-${this.config.metadata.accuracy.toLowerCase()}">
            ${this.config.metadata.accuracy} Accuracy
          </span>
          <span class="complexity-badge badge-${this.config.metadata.complexity.toLowerCase()}">
            ${this.config.metadata.complexity}
          </span>
        </div>
      </div>

      <form class="calculator-form" novalidate>
        ${this.renderInputSections()}
        
        <div class="calculator-actions">
          <button type="submit" class="btn btn-primary btn-lg calculate-btn">
            <span class="btn-text">Calculate</span>
            <span class="btn-loader" hidden>
              <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            </span>
          </button>
          <button type="button" class="btn btn-secondary reset-btn">Reset</button>
          <button type="button" class="btn btn-ghost advanced-btn">Advanced Options</button>
        </div>
      </form>

      <div class="calculator-results" aria-live="polite">
        ${this.renderOutputSections()}
      </div>

      <div class="calculator-tools">
        <div class="export-options">
          <button class="btn btn-sm btn-ghost export-pdf">
            📄 Export PDF
          </button>
          <button class="btn btn-sm btn-ghost export-csv">
            📊 Export CSV
          </button>
          <button class="btn btn-sm btn-ghost share-link">
            🔗 Share Link
          </button>
        </div>
      </div>

      <div class="calculator-methodology" hidden>
        <details>
          <summary>Calculation Methodology</summary>
          <div class="methodology-content">
            ${this.renderMethodology()}
          </div>
        </details>
      </div>

      <div class="calculator-disclaimer">
        <p class="disclaimer-text">
          <strong>Disclaimer:</strong> This calculator provides ${this.config.metadata.accuracy} estimates for planning purposes only. 
          Always consult with qualified professionals and verify with current market conditions.
        </p>
      </div>
    `;
  }

  private renderInputSections(): string {
    // Group inputs by category
    const categories = this.groupInputsByCategory();
    
    return Object.entries(categories).map(([category, inputs]) => `
      <fieldset class="input-section">
        <legend class="section-title">${category || 'Project Details'}</legend>
        <div class="input-grid">
          ${inputs.map(input => this.renderInputField(input)).join('')}
        </div>
      </fieldset>
    `).join('');
  }

  private renderInputField(input: InputField): string {
    const value = this.inputs.get(input.id) || '';
    const errors = this.errors.get(input.id) || [];
    const hasErrors = errors.length > 0;

    let fieldHtml = '';
    
    switch (input.type) {
      case 'number':
        fieldHtml = `
          <input 
            type="number" 
            id="${input.id}"
            name="${input.id}"
            class="form-input ${hasErrors ? 'error' : ''}"
            placeholder="${input.placeholder || ''}"
            min="${input.min || ''}"
            max="${input.max || ''}"
            step="${input.step || 'any'}"
            value="${value}"
            ${input.required ? 'required' : ''}
            aria-describedby="${input.id}-help ${hasErrors ? input.id + '-error' : ''}"
          />
          ${input.unit ? `<span class="input-unit">${input.unit}</span>` : ''}
        `;
        break;
        
      case 'select':
        fieldHtml = `
          <select 
            id="${input.id}"
            name="${input.id}"
            class="form-select ${hasErrors ? 'error' : ''}"
            ${input.required ? 'required' : ''}
            aria-describedby="${input.id}-help ${hasErrors ? input.id + '-error' : ''}"
          >
            ${input.options?.map(option => `
              <option value="${option.value}" ${value === option.value ? 'selected' : ''}>
                ${option.label}
              </option>
            `).join('') || ''}
          </select>
        `;
        break;
        
      case 'range':
        fieldHtml = `
          <div class="range-input-container">
            <input 
              type="range" 
              id="${input.id}"
              name="${input.id}"
              class="form-range ${hasErrors ? 'error' : ''}"
              min="${input.min || 0}"
              max="${input.max || 100}"
              step="${input.step || 1}"
              value="${value}"
              ${input.required ? 'required' : ''}
              aria-describedby="${input.id}-help ${hasErrors ? input.id + '-error' : ''}"
            />
            <output class="range-value" for="${input.id}">${value}${input.unit || ''}</output>
          </div>
        `;
        break;
    }

    return `
      <div class="form-field ${hasErrors ? 'field-error' : ''}">
        <label for="${input.id}" class="form-label">
          ${input.label}
          ${input.required ? '<span class="required-indicator" aria-label="required">*</span>' : ''}
          ${input.tooltip ? `
            <button type="button" class="tooltip-trigger" aria-describedby="${input.id}-tooltip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              <span class="sr-only">Help</span>
            </button>
            <div id="${input.id}-tooltip" class="tooltip" role="tooltip" hidden>
              ${input.tooltip}
            </div>
          ` : ''}
        </label>
        
        <div class="input-container">
          ${fieldHtml}
        </div>
        
        ${input.tooltip ? `<p id="${input.id}-help" class="field-help">${input.tooltip}</p>` : ''}
        
        ${hasErrors ? `
          <div id="${input.id}-error" class="field-errors" role="alert">
            ${errors.map(error => `<p class="error-message">${error}</p>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderOutputSections(): string {
    const categories = this.groupOutputsByCategory();
    
    return Object.entries(categories).map(([category, outputs]) => `
      <div class="output-section">
        <h3 class="section-title">${category || 'Results'}</h3>
        <div class="output-grid">
          ${outputs.map(output => this.renderOutputField(output)).join('')}
        </div>
      </div>
    `).join('');
  }

  private renderOutputField(output: OutputField): string {
    const value = this.outputs.get(output.id) || 0;
    const formattedValue = this.formatValue(value, output);
    
    return `
      <div class="output-field">
        <div class="output-label">
          ${output.label}
          ${output.description ? `
            <span class="output-description">${output.description}</span>
          ` : ''}
        </div>
        <div class="output-value" data-output="${output.id}">
          ${formattedValue}
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    // Form submission
    const form = this.element.querySelector('.calculator-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.calculate();
    });

    // Real-time input changes
    this.config.inputs.forEach(input => {
      const element = this.element.querySelector(`#${input.id}`) as HTMLInputElement;
      if (element) {
        element.addEventListener('input', (e) => {
          this.handleInputChange(input.id, (e.target as HTMLInputElement).value);
        });
        
        element.addEventListener('blur', (e) => {
          this.validateField(input.id, (e.target as HTMLInputElement).value);
        });
      }
    });

    // Action buttons
    const resetBtn = this.element.querySelector('.reset-btn');
    resetBtn?.addEventListener('click', () => this.reset());

    const advancedBtn = this.element.querySelector('.advanced-btn');
    advancedBtn?.addEventListener('click', () => this.toggleAdvancedOptions());

    // Export buttons
    const exportPdfBtn = this.element.querySelector('.export-pdf');
    exportPdfBtn?.addEventListener('click', () => this.exportPDF());

    const exportCsvBtn = this.element.querySelector('.export-csv');
    exportCsvBtn?.addEventListener('click', () => this.exportCSV());

    const shareLinkBtn = this.element.querySelector('.share-link');
    shareLinkBtn?.addEventListener('click', () => this.generateShareLink());

    // Tooltip triggers
    this.element.querySelectorAll('.tooltip-trigger').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleTooltip(trigger as HTMLElement);
      });
    });
  }

  private handleInputChange(fieldId: string, value: any): void {
    // Update internal state
    this.inputs.set(fieldId, value);
    
    // Clear previous errors for this field
    this.errors.delete(fieldId);
    
    // Real-time validation
    this.validateField(fieldId, value);
    
    // Auto-calculate if all required fields are filled
    if (this.areRequiredFieldsFilled()) {
      this.debounceCalculate();
    }
    
    // Emit change event
    this.emit('inputChange', { fieldId, value });
  }

  private validateField(fieldId: string, value: any): boolean {
    const input = this.config.inputs.find(i => i.id === fieldId);
    if (!input) return true;

    const errors: string[] = [];

    // Required validation
    if (input.required && (!value || value === '')) {
      errors.push(`${input.label} is required`);
    }

    // Type-specific validation
    if (value && input.type === 'number') {
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        errors.push(`${input.label} must be a valid number`);
      } else {
        if (input.min !== undefined && numValue < input.min) {
          errors.push(`${input.label} must be at least ${input.min}`);
        }
        if (input.max !== undefined && numValue > input.max) {
          errors.push(`${input.label} must be no more than ${input.max}`);
        }
      }
    }

    // Custom validation
    if (input.validation?.custom) {
      const customErrors = input.validation.custom(value, this.inputs);
      errors.push(...customErrors);
    }

    // Update UI
    if (errors.length > 0) {
      this.errors.set(fieldId, errors);
      this.showFieldErrors(fieldId, errors);
    } else {
      this.errors.delete(fieldId);
      this.clearFieldErrors(fieldId);
    }

    return errors.length === 0;
  }

  private calculate(): void {
    if (this.isCalculating) return;
    
    this.isCalculating = true;
    this.showCalculating();
    
    // Validate all inputs
    const isValid = this.validateAllInputs();
    
    if (!isValid) {
      this.isCalculating = false;
      this.hideCalculating();
      return;
    }

    try {
      // Perform calculations
      const startTime = performance.now();
      
      this.config.calculations.forEach(calc => {
        const result = this.executeCalculation(calc);
        this.outputs.set(calc.id, result);
      });

      const calculationTime = performance.now() - startTime;
      
      // Update UI
      this.updateOutputs();
      
      // Save to history
      this.saveToHistory();
      
      // Analytics
      this.trackCalculation(calculationTime);
      
      // Emit calculation complete event
      this.emit('calculationComplete', {
        inputs: Object.fromEntries(this.inputs),
        outputs: Object.fromEntries(this.outputs),
        calculationTime
      });
      
    } catch (error) {
      console.error('Calculation error:', error);
      this.showCalculationError(error as Error);
    } finally {
      this.isCalculating = false;
      this.hideCalculating();
    }
  }

  private executeCalculation(calc: CalculationMethod): number {
    // Create calculation context
    const context = Object.fromEntries(this.inputs);
    
    // Add utility functions
    context.Math = Math;
    context.round = (num: number, decimals: number = 2) => 
      Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    context.max = Math.max;
    context.min = Math.min;
    
    // Execute formula safely
    try {
      const func = new Function(...Object.keys(context), `return ${calc.formula}`);
      const result = func(...Object.values(context));
      
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error(`Invalid calculation result for ${calc.name}`);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Calculation error in ${calc.name}: ${error.message}`);
    }
  }

  private updateOutputs(): void {
    this.config.outputs.forEach(output => {
      const element = this.element.querySelector(`[data-output="${output.id}"]`);
      if (element) {
        const value = this.outputs.get(output.id) || 0;
        const formattedValue = this.formatValue(value, output);
        
        element.textContent = formattedValue;
        element.classList.add('animate-scale-in');
      }
    });
  }

  private formatValue(value: number, output: OutputField): string {
    switch (output.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: output.precision || 2,
          maximumFractionDigits: output.precision || 2,
          notation: output.format === 'compact' ? 'compact' : 'standard'
        }).format(value);
        
      case 'percentage':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: output.precision || 1,
          maximumFractionDigits: output.precision || 1
        }).format(value / 100);
        
      case 'number':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: output.precision || 2,
          maximumFractionDigits: output.precision || 2,
          notation: output.format === 'compact' ? 'compact' : 'standard'
        }).format(value) + (output.unit ? ` ${output.unit}` : '');
        
      default:
        return String(value);
    }
  }

  // Event system
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => listener(data));
  }

  public on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Public API methods
  public getInputValue(fieldId: string): any {
    return this.inputs.get(fieldId);
  }

  public setInputValue(fieldId: string, value: any): void {
    this.inputs.set(fieldId, value);
    const element = this.element.querySelector(`#${fieldId}`) as HTMLInputElement;
    if (element) {
      element.value = value;
    }
    this.handleInputChange(fieldId, value);
  }

  public getOutputValue(fieldId: string): any {
    return this.outputs.get(fieldId);
  }

  public reset(): void {
    this.inputs.clear();
    this.outputs.clear();
    this.errors.clear();
    this.setupInputDefaults();
    
    // Reset form
    const form = this.element.querySelector('.calculator-form') as HTMLFormElement;
    form.reset();
    
    // Clear outputs
    this.element.querySelectorAll('[data-output]').forEach(element => {
      element.textContent = '—';
    });
    
    // Clear errors
    this.element.querySelectorAll('.field-error').forEach(element => {
      element.classList.remove('field-error');
    });
    
    this.emit('reset');
  }

  public exportPDF(): void {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
  }

  public exportCSV(): void {
    // Implementation for CSV export
    console.log('Exporting to CSV...');
  }

  public generateShareLink(): string {
    const params = new URLSearchParams();
    this.inputs.forEach((value, key) => {
      params.set(key, String(value));
    });
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      this.showNotification('Share link copied to clipboard!', 'success');
    });
    
    return shareUrl;
  }

  // Helper methods
  private groupInputsByCategory(): { [category: string]: InputField[] } {
    return this.config.inputs.reduce((groups, input) => {
      const category = input.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(input);
      return groups;
    }, {} as { [category: string]: InputField[] });
  }

  private groupOutputsByCategory(): { [category: string]: OutputField[] } {
    return this.config.outputs.reduce((groups, output) => {
      const category = output.category || 'Results';
      if (!groups[category]) groups[category] = [];
      groups[category].push(output);
      return groups;
    }, {} as { [category: string]: OutputField[] });
  }

  private areRequiredFieldsFilled(): boolean {
    return this.config.validation.required.every(fieldId => {
      const value = this.inputs.get(fieldId);
      return value !== undefined && value !== '' && value !== null;
    });
  }

  private validateAllInputs(): boolean {
    let isValid = true;
    
    this.config.inputs.forEach(input => {
      const value = this.inputs.get(input.id);
      if (!this.validateField(input.id, value)) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  private debounceCalculate = this.debounce(() => this.calculate(), 300);

  private debounce(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  private showCalculating(): void {
    const btn = this.element.querySelector('.calculate-btn');
    if (btn) {
      btn.classList.add('calculating');
      const text = btn.querySelector('.btn-text');
      const loader = btn.querySelector('.btn-loader');
      if (text) text.textContent = 'Calculating...';
      if (loader) loader.removeAttribute('hidden');
    }
  }

  private hideCalculating(): void {
    const btn = this.element.querySelector('.calculate-btn');
    if (btn) {
      btn.classList.remove('calculating');
      const text = btn.querySelector('.btn-text');
      const loader = btn.querySelector('.btn-loader');
      if (text) text.textContent = 'Calculate';
      if (loader) loader.setAttribute('hidden', '');
    }
  }

  private showFieldErrors(fieldId: string, errors: string[]): void {
    const field = this.element.querySelector(`[data-field="${fieldId}"]`);
    if (field) {
      field.classList.add('field-error');
      // Update error display
    }
  }

  private clearFieldErrors(fieldId: string): void {
    const field = this.element.querySelector(`[data-field="${fieldId}"]`);
    if (field) {
      field.classList.remove('field-error');
      // Clear error display
    }
  }

  private showCalculationError(error: Error): void {
    this.showNotification(`Calculation error: ${error.message}`, 'error');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Implementation for toast notifications
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  private saveToHistory(): void {
    const calculation: CalculationHistory = {
      timestamp: new Date().toISOString(),
      inputs: Object.fromEntries(this.inputs),
      outputs: Object.fromEntries(this.outputs),
      calculatorId: this.config.id
    };
    
    this.history.push(calculation);
    
    // Limit history size
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(`calculator_history_${this.config.id}`, JSON.stringify(this.history));
    } catch (error) {
      console.warn('Could not save calculation history:', error);
    }
  }

  private trackCalculation(calculationTime: number): void {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'calculator_calculation', {
        calculator_id: this.config.id,
        calculation_time: calculationTime,
        input_count: this.inputs.size,
        output_count: this.outputs.size
      });
    }
  }

  private setupAccessibility(): void {
    // Add ARIA landmarks
    this.element.setAttribute('role', 'application');
    this.element.setAttribute('aria-label', `${this.config.name} Calculator`);
    
    // Add keyboard navigation
    this.setupKeyboardNavigation();
    
    // Add screen reader announcements
    this.setupScreenReaderAnnouncements();
  }

  private setupKeyboardNavigation(): void {
    // Implementation for keyboard navigation
  }

  private setupScreenReaderAnnouncements(): void {
    // Implementation for screen reader support
  }

  private setupPerformanceMonitoring(): void {
    // Monitor calculation performance
    this.on('calculationComplete', (data) => {
      if (data.calculationTime > 100) {
        console.warn(`Slow calculation detected: ${data.calculationTime}ms`);
      }
    });
  }

  private setupProgressiveEnhancement(): void {
    // Add progressive enhancement features
    this.element.classList.add('js-enhanced');
    
    // Add modern features if supported
    if ('IntersectionObserver' in window) {
      this.setupLazyLoading();
    }
    
    if ('ResizeObserver' in window) {
      this.setupResponsiveEnhancements();
    }
  }

  private setupLazyLoading(): void {
    // Implementation for lazy loading
  }

  private setupResponsiveEnhancements(): void {
    // Implementation for responsive enhancements
  }

  private renderMethodology(): string {
    return this.config.calculations.map(calc => `
      <div class="methodology-item">
        <h4>${calc.name}</h4>
        <code class="formula">${calc.formula}</code>
        ${calc.dependencies.length > 0 ? `
          <p><strong>Dependencies:</strong> ${calc.dependencies.join(', ')}</p>
        ` : ''}
      </div>
    `).join('');
  }

  private toggleAdvancedOptions(): void {
    const methodology = this.element.querySelector('.calculator-methodology');
    if (methodology) {
      methodology.toggleAttribute('hidden');
    }
  }

  private toggleTooltip(trigger: HTMLElement): void {
    const tooltipId = trigger.getAttribute('aria-describedby');
    if (tooltipId) {
      const tooltip = document.getElementById(tooltipId);
      if (tooltip) {
        tooltip.toggleAttribute('hidden');
      }
    }
  }
}

// Type definitions
interface SelectOption {
  value: string;
  label: string;
}

interface CalculationCondition {
  field: string;
  operator: '=' | '>' | '<' | '>=' | '<=' | '!=';
  value: any;
}

interface FieldValidation {
  custom?: (value: any, allInputs: Map<string, any>) => string[];
}

interface CustomValidation {
  field: string;
  validator: (value: any, allInputs: Map<string, any>) => string | null;
}

interface CalculationHistory {
  timestamp: string;
  inputs: { [key: string]: any };
  outputs: { [key: string]: any };
  calculatorId: string;
}

export { EnhancedCalculator, type CalculatorConfig, type InputField, type OutputField };
