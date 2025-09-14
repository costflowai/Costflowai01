/**
 * CostFlowAI Client-Side Error Monitoring
 * Automatically captures and reports JavaScript errors and issues
 */

class ErrorMonitoring {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        this.reportingEndpoint = null; // Will use localStorage fallback
        this.sessionId = this.generateSessionId();
        this.listeners = [];
        this.intervals = [];
        this.originalFetch = null;
        
        this.init();
    }

    init() {
        this.setupErrorHandlers();
        this.setupPerformanceMonitoring();
        this.setupUserInteractionTracking();
        this.startPeriodicHealthChecks();
        
        console.log('🐛 Error monitoring initialized');
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    setupErrorHandlers() {
        // Global error handler with cleanup tracking
        const errorHandler = (event) => {
            this.captureError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionId: this.sessionId
            });
        };
        window.addEventListener('error', errorHandler);
        this.listeners.push({ element: window, event: 'error', handler: errorHandler });

        // Unhandled promise rejections with cleanup tracking
        const rejectionHandler = (event) => {
            this.captureError({
                type: 'unhandled_promise_rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                sessionId: this.sessionId
            });
        };
        window.addEventListener('unhandledrejection', rejectionHandler);
        this.listeners.push({ element: window, event: 'unhandledrejection', handler: rejectionHandler });

        // Network errors (fetch failures) - store original for restoration
        this.originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await this.originalFetch(...args);
                
                // Log failed HTTP requests
                if (!response.ok) {
                    this.captureError({
                        type: 'network_error',
                        message: `HTTP ${response.status}: ${args[0]}`,
                        status: response.status,
                        url: args[0],
                        timestamp: new Date().toISOString(),
                        sessionId: this.sessionId
                    });
                }
                
                return response;
            } catch (error) {
                this.captureError({
                    type: 'fetch_error',
                    message: error.message,
                    url: args[0],
                    stack: error.stack,
                    timestamp: new Date().toISOString(),
                    sessionId: this.sessionId
                });
                throw error;
            }
        };
    }

    setupPerformanceMonitoring() {
        // Monitor page load times
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                
                if (perfData) {
                    const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                    const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
                    
                    // Report slow loading times
                    if (loadTime > 5000) { // 5 seconds
                        this.captureError({
                            type: 'performance_issue',
                            message: 'Slow page load detected',
                            loadTime: loadTime,
                            domContentLoaded: domContentLoaded,
                            timestamp: new Date().toISOString(),
                            url: window.location.href,
                            sessionId: this.sessionId
                        });
                    }
                }
            }, 1000);
        });

        // Monitor memory usage (if available)
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                
                // Report high memory usage
                if (memoryUsage > 0.9) { // 90% memory usage
                    this.captureError({
                        type: 'memory_issue',
                        message: 'High memory usage detected',
                        memoryUsage: memoryUsage,
                        usedMemory: memory.usedJSHeapSize,
                        totalMemory: memory.jsHeapSizeLimit,
                        timestamp: new Date().toISOString(),
                        url: window.location.href,
                        sessionId: this.sessionId
                    });
                }
            }, 30000); // Check every 30 seconds
        }
    }

    setupUserInteractionTracking() {
        // Track broken form submissions
        document.addEventListener('submit', (event) => {
            const form = event.target;
            
            // Check for required fields
            const requiredFields = form.querySelectorAll('[required]');
            const emptyRequired = Array.from(requiredFields).filter(field => !field.value.trim());
            
            if (emptyRequired.length > 0) {
                this.captureError({
                    type: 'form_validation_error',
                    message: 'Form submission with empty required fields',
                    emptyFields: emptyRequired.map(field => field.name || field.id),
                    formAction: form.action,
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    sessionId: this.sessionId
                });
            }
        });

        // Track broken button clicks
        document.addEventListener('click', (event) => {
            const button = event.target.closest('button, [onclick]');
            if (button) {
                // Check if button has onclick but no function exists safely (no eval)
                const onclick = button.getAttribute('onclick');
                if (onclick) {
                    const fnName = String(onclick).trim().split('(')[0].trim();
                    const isValidName = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(fnName);
                    const fnExists = isValidName && typeof window[fnName] === 'function';
                    if (!fnExists) {
                        this.captureError({
                            type: 'broken_onclick_handler',
                            message: 'Invalid or missing onclick function detected',
                            onclick: onclick,
                            buttonText: button.textContent?.trim(),
                            timestamp: new Date().toISOString(),
                            url: window.location.href,
                            sessionId: this.sessionId
                        });
                    }
                }
            }
        });
    }

    startPeriodicHealthChecks() {
        // Check for dead links periodically
        const interval = setInterval(() => {
            this.checkPageHealth();
        }, 300000); // Every 5 minutes
        this.intervals.push(interval);
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        // Remove all event listeners
        this.listeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.listeners = [];

        // Clear all intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];

        // Restore original fetch if modified
        if (this.originalFetch) {
            window.fetch = this.originalFetch;
            this.originalFetch = null;
        }

        console.log('ErrorMonitoring cleanup completed');
    }

    async checkPageHealth() {
        try {
            // Check critical elements exist
            const criticalElements = [
                'nav',
                '.calculate-btn, [data-action="calculate"]',
                '.feedback-button, #feedback-button'
            ];

            for (const selector of criticalElements) {
                if (!document.querySelector(selector)) {
                    this.captureError({
                        type: 'missing_critical_element',
                        message: `Critical element missing: ${selector}`,
                        timestamp: new Date().toISOString(),
                        url: window.location.href,
                        sessionId: this.sessionId
                    });
                }
            }

            // Check for console errors
            if (this.hasConsoleErrors()) {
                this.captureError({
                    type: 'console_errors_detected',
                    message: 'Console errors detected on page',
                    timestamp: new Date().toISOString(),
                    url: window.location.href,
                    sessionId: this.sessionId
                });
            }

        } catch (error) {
            this.captureError({
                type: 'health_check_error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                sessionId: this.sessionId
            });
        }
    }

    hasConsoleErrors() {
        // This is a simplified check - in real implementation,
        // you'd need to hook into console.error
        try {
            // Check if any error indicators exist in DOM
            const errorElements = document.querySelectorAll('.error, [class*="error"], [id*="error"]');
            return errorElements.length > 0;
        } catch (error) {
            return false;
        }
    }

    captureError(errorData) {
        // Add to local storage
        this.errors.push(errorData);
        
        // Keep only recent errors
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(-this.maxErrors);
        }
        
        // Store in localStorage for manual collection
        this.storeErrors();
        
        // Log to console for development
        console.error('🐛 Error captured:', errorData);
        
        // Try to send to external service if available
        this.reportError(errorData);
        
        // Show user-friendly error message for critical errors
        if (this.isCriticalError(errorData)) {
            this.showUserErrorMessage(errorData);
        }
    }

    storeErrors() {
        try {
            localStorage.setItem('costflowai_errors', JSON.stringify(this.errors));
        } catch (error) {
            console.error('Failed to store errors:', error);
        }
    }

    async reportError(errorData) {
        // Try to send to feedback system if available
        if (window.feedbackGoogleSheets) {
            try {
                await window.feedbackGoogleSheets.submitFeedback({
                    type: 'error_report',
                    sheet: 'Error_Reports',
                    error_type: errorData.type,
                    message: errorData.message,
                    stack: errorData.stack,
                    url: errorData.url,
                    timestamp: errorData.timestamp,
                    session_id: errorData.sessionId,
                    user_agent: errorData.userAgent
                });
            } catch (error) {
                console.log('Failed to report error to external service:', error);
            }
        }
        
        // Track in analytics if available
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: errorData.message,
                fatal: this.isCriticalError(errorData)
            });
        }
    }

    isCriticalError(errorData) {
        const criticalTypes = [
            'javascript_error',
            'unhandled_promise_rejection',
            'missing_critical_element'
        ];
        
        return criticalTypes.includes(errorData.type) || 
               errorData.message?.includes('calculation') ||
               errorData.message?.includes('feedback');
    }

    showUserErrorMessage(errorData) {
        // Only show for truly critical errors that affect user functionality
        if (errorData.type === 'missing_critical_element' || 
            errorData.message?.includes('calculation')) {
            
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #fef2f2;
                    border: 2px solid #fecaca;
                    color: #991b1b;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    z-index: 10000;
                    max-width: 350px;
                ">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="font-size: 18px;">⚠️</span>
                        <strong>Something's not working right</strong>
                    </div>
                    <p style="margin: 0 0 10px; font-size: 14px;">
                        We've detected an issue. Please refresh the page or try again.
                    </p>
                    <div style="display: flex; gap: 8px;">
                        <button onclick="location.reload()" style="
                            background: #991b1b; color: white; border: none;
                            padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;
                        ">Refresh Page</button>
                        <button onclick="this.closest('div').remove()" style="
                            background: none; border: 1px solid #991b1b; color: #991b1b;
                            padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;
                        ">Dismiss</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remove after 15 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 15000);
        }
    }

    // Public methods for manual error collection
    static getAllErrors() {
        try {
            return JSON.parse(localStorage.getItem('costflowai_errors') || '[]');
        } catch (error) {
            return [];
        }
    }

    static clearErrors() {
        try {
            localStorage.removeItem('costflowai_errors');
            console.log('Error log cleared');
        } catch (error) {
            console.error('Failed to clear errors:', error);
        }
    }

    static getErrorStats() {
        const errors = ErrorMonitoring.getAllErrors();
        const stats = {};
        
        errors.forEach(error => {
            stats[error.type] = (stats[error.type] || 0) + 1;
        });
        
        return {
            totalErrors: errors.length,
            errorTypes: stats,
            recentErrors: errors.slice(-10)
        };
    }
}

// Initialize error monitoring when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.errorMonitoring = new ErrorMonitoring();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorMonitoring;
}