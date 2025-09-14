/**
 * Production-safe logger utility
 * Prevents console logs from appearing in production
 */

const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('.local') ||
                      window.location.search.includes('debug=true');

const logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    
    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    
    error: (...args) => {
        // Always log errors, but in production send to monitoring
        console.error(...args);
        
        // Send to error monitoring in production
        if (!isDevelopment && window.errorMonitoring) {
            window.errorMonitoring.captureError({
                type: 'console_error',
                message: args.join(' '),
                timestamp: new Date().toISOString()
            });
        }
    },
    
    debug: (...args) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },
    
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },
    
    table: (...args) => {
        if (isDevelopment) {
            console.table(...args);
        }
    },
    
    time: (label) => {
        if (isDevelopment) {
            console.time(label);
        }
    },
    
    timeEnd: (label) => {
        if (isDevelopment) {
            console.timeEnd(label);
        }
    }
};

// Replace global console in production
if (!isDevelopment) {
    // Store original console for error reporting
    window._originalConsole = window.console;
    
    // Override console methods
    window.console = {
        ...window.console,
        log: logger.log,
        warn: logger.warn,
        error: logger.error,
        debug: logger.debug,
        info: logger.info,
        table: logger.table,
        time: logger.time,
        timeEnd: logger.timeEnd
    };
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
}

// Make available globally
window.logger = logger;
window.isDevelopment = isDevelopment;
