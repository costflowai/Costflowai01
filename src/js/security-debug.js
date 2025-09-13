/**
 * Security & Debug Enhancement for Calculator System
 * Hardens calculators against XSS, validates inputs, and adds error handling
 */

class SecurityDebugger {
    constructor() {
        this.init();
        this.monitorPerformance();
        this.validateCalculators();
    }

    init() {
        // Content Security Policy enforcement
        this.enforceCSP();
        
        // Input sanitization
        this.sanitizeInputs();
        
        // Error monitoring
        this.setupErrorHandling();
        
        // Performance monitoring
        this.startPerformanceMonitoring();
        
        console.log('🔒 Security & Debug system initialized');
    }

    enforceCSP() {
        // Add meta CSP if not present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const csp = document.createElement('meta');
            csp.setAttribute('http-equiv', 'Content-Security-Policy');
            csp.setAttribute('content', 
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self'; " +
                "connect-src 'self'"
            );
            document.head.appendChild(csp);
        }
    }

    sanitizeInputs() {
        // Override innerHTML to prevent XSS
        const originalInnerHTML = Element.prototype.__lookupSetter__('innerHTML');
        if (originalInnerHTML) {
            Object.defineProperty(Element.prototype, 'innerHTML', {
                set: function(html) {
                    if (typeof html === 'string') {
                        // Basic XSS prevention
                        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                        html = html.replace(/javascript:/gi, '');
                        html = html.replace(/on\w+\s*=/gi, '');
                    }
                    originalInnerHTML.call(this, html);
                }
            });
        }

        // Validate all number inputs
        document.addEventListener('input', (e) => {
            if (e.target.type === 'number') {
                this.validateNumberInput(e.target);
            }
        });
    }

    validateNumberInput(input) {
        const value = parseFloat(input.value);
        const min = parseFloat(input.min) || 0;
        const max = parseFloat(input.max) || Infinity;

        if (isNaN(value)) {
            input.setCustomValidity('Please enter a valid number');
            input.classList.add('error');
        } else if (value < min) {
            input.setCustomValidity(`Value must be at least ${min}`);
            input.classList.add('error');
        } else if (value > max) {
            input.setCustomValidity(`Value cannot exceed ${max}`);
            input.classList.add('error');
        } else {
            input.setCustomValidity('');
            input.classList.remove('error');
        }
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            this.logError('JavaScript Error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                stack: e.error?.stack
            });
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            this.logError('Unhandled Promise Rejection', {
                reason: e.reason
            });
        });

        // Calculator-specific error handling
        this.wrapCalculatorMethods();
    }

    wrapCalculatorMethods() {
        // Wrap common calculator functions with try-catch
        const originalFunctions = {};
        
        ['calculateAdvancedConcrete', 'calculateCrewOptimization', 'calculateMaterialOptimization'].forEach(funcName => {
            if (window[funcName]) {
                originalFunctions[funcName] = window[funcName];
                window[funcName] = (...args) => {
                    try {
                        this.startPerformanceTimer(funcName);
                        const result = originalFunctions[funcName].apply(this, args);
                        this.endPerformanceTimer(funcName);
                        return result;
                    } catch (error) {
                        this.logError(`Calculator Error: ${funcName}`, error);
                        this.showUserError('Calculation failed. Please check your inputs.');
                        throw error;
                    }
                };
            }
        });
    }

    logError(type, error) {
        const errorData = {
            timestamp: new Date().toISOString(),
            type: type,
            error: error,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Store errors locally (last 50)
        try {
            const errors = JSON.parse(localStorage.getItem('calculator_errors') || '[]');
            errors.unshift(errorData);
            if (errors.length > 50) errors.splice(50);
            localStorage.setItem('calculator_errors', JSON.stringify(errors));
        } catch (e) {
            console.error('Failed to log error:', e);
        }

        console.error('🚨', type, error);
    }

    showUserError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 9999;
            max-width: 300px;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    startPerformanceMonitoring() {
        this.performanceData = {};
        
        // Monitor page load time
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            this.logPerformance('Page Load', loadTime);
        });

        // Monitor calculator calculations
        this.calculationTimes = [];
    }

    startPerformanceTimer(operation) {
        this.performanceData[operation] = performance.now();
    }

    endPerformanceTimer(operation) {
        if (this.performanceData[operation]) {
            const duration = performance.now() - this.performanceData[operation];
            this.logPerformance(operation, duration);
            delete this.performanceData[operation];
        }
    }

    logPerformance(operation, duration) {
        const perfData = {
            operation: operation,
            duration: duration,
            timestamp: new Date().toISOString()
        };

        // Warn if calculation takes too long
        if (duration > 1000) {
            console.warn(`⚠️ Slow operation: ${operation} took ${duration.toFixed(2)}ms`);
        }

        // Store performance data
        try {
            const perfLog = JSON.parse(localStorage.getItem('calculator_performance') || '[]');
            perfLog.unshift(perfData);
            if (perfLog.length > 100) perfLog.splice(100);
            localStorage.setItem('calculator_performance', JSON.stringify(perfLog));
        } catch (e) {
            console.error('Failed to log performance:', e);
        }
    }

    validateCalculators() {
        // Check for required elements
        const requiredElements = ['total', 'breakdown-table'];
        const missingElements = [];

        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        });

        if (missingElements.length > 0) {
            console.warn('Missing required elements:', missingElements);
        }

        // Validate calculator instances
        this.validateCalculatorInstances();

        // Check mobile responsiveness
        this.checkMobileResponsiveness();
    }

    validateCalculatorInstances() {
        const calculators = ['concreteCalc', 'laborOptimizer', 'materialOptimizer'];
        
        calculators.forEach(calcName => {
            if (window[calcName]) {
                try {
                    // Check if calculator has required methods
                    const requiredMethods = ['calculate', 'saveToHistory', 'exportCSV'];
                    requiredMethods.forEach(method => {
                        if (typeof window[calcName][method] !== 'function') {
                            console.warn(`Calculator ${calcName} missing method: ${method}`);
                        }
                    });
                } catch (e) {
                    console.error(`Error validating calculator ${calcName}:`, e);
                }
            }
        });
    }

    checkMobileResponsiveness() {
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        if (viewport.width < 768) {
            // Mobile optimizations
            document.body.classList.add('mobile-mode');
            
            // Ensure touch targets are large enough
            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
                const rect = btn.getBoundingClientRect();
                if (rect.height < 44 || rect.width < 44) {
                    btn.style.minHeight = '44px';
                    btn.style.minWidth = '44px';
                }
            });
        }
    }

    monitorPerformance() {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > 50000000) { // 50MB
                    console.warn('High memory usage detected:', memory);
                }
            }, 30000);
        }

        // Monitor slow calculations
        let calcStartTime;
        document.addEventListener('input', () => {
            calcStartTime = performance.now();
        });

        // Monitor when results are updated
        const observer = new MutationObserver(() => {
            if (calcStartTime) {
                const calcTime = performance.now() - calcStartTime;
                if (calcTime > 100) {
                    console.warn(`Slow calculation: ${calcTime.toFixed(2)}ms`);
                }
                calcStartTime = null;
            }
        });

        const totalElement = document.getElementById('total');
        if (totalElement) {
            observer.observe(totalElement, { childList: true, subtree: true });
        }
    }

    // Debug utilities
    getErrorLog() {
        try {
            return JSON.parse(localStorage.getItem('calculator_errors') || '[]');
        } catch (e) {
            return [];
        }
    }

    getPerformanceLog() {
        try {
            return JSON.parse(localStorage.getItem('calculator_performance') || '[]');
        } catch (e) {
            return [];
        }
    }

    clearLogs() {
        localStorage.removeItem('calculator_errors');
        localStorage.removeItem('calculator_performance');
        console.log('Debug logs cleared');
    }

    // Security audit
    runSecurityAudit() {
        const audit = {
            timestamp: new Date().toISOString(),
            issues: [],
            passed: []
        };

        // Check for CSP
        const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (csp) {
            audit.passed.push('Content Security Policy present');
        } else {
            audit.issues.push('Missing Content Security Policy');
        }

        // Check for HTTPS
        if (location.protocol === 'https:') {
            audit.passed.push('HTTPS enabled');
        } else {
            audit.issues.push('Not using HTTPS');
        }

        // Check for sensitive data in localStorage
        const sensitiveKeys = ['password', 'token', 'key', 'secret'];
        Object.keys(localStorage).forEach(key => {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                audit.issues.push(`Potentially sensitive data in localStorage: ${key}`);
            }
        });

        // Check for inline scripts
        const inlineScripts = document.querySelectorAll('script:not([src])');
        if (inlineScripts.length > 0) {
            audit.issues.push(`${inlineScripts.length} inline scripts found`);
        } else {
            audit.passed.push('No inline scripts');
        }

        console.log('🔍 Security Audit Results:', audit);
        return audit;
    }
}

// Initialize security & debug system
document.addEventListener('DOMContentLoaded', () => {
    window.securityDebugger = new SecurityDebugger();
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityDebugger;
}