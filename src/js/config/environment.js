/**
 * Environment Configuration
 * Centralizes environment detection and configuration
 */

(function() {
    'use strict';
    
    // Detect environment
    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || 
                         hostname === '127.0.0.1' ||
                         hostname.includes('.local') ||
                         window.location.search.includes('debug=true');
    
    const isStaging = hostname.includes('staging') || 
                      hostname.includes('test') ||
                      hostname.includes('preview');
    
    const isProduction = !isDevelopment && !isStaging;
    
    // Configuration object
    const ENV = {
        // Environment flags
        isDevelopment,
        isStaging,
        isProduction,
        
        // API endpoints
        API_BASE_URL: isProduction ? 'https://api.costflowai.com' : 
                      isStaging ? 'https://staging-api.costflowai.com' : 
                      'http://localhost:3000',
        
        // Feature flags
        features: {
            debugMode: isDevelopment,
            errorReporting: isProduction,
            analytics: isProduction || isStaging,
            performanceMonitoring: isProduction,
            consoleLogging: isDevelopment,
            usageLimits: isProduction,
            caching: isProduction || isStaging,
            serviceWorker: isProduction
        },
        
        // Performance settings
        performance: {
            lazyLoadImages: true,
            preloadCriticalAssets: isProduction,
            minifyAssets: isProduction,
            compressionEnabled: isProduction,
            cdnEnabled: isProduction
        },
        
        // Security settings
        security: {
            enforceHTTPS: isProduction,
            csrfProtection: isProduction,
            rateLimiting: isProduction,
            sanitizeInputs: true
        },
        
        // Cache settings
        cache: {
            version: '1.0.0',
            ttl: isProduction ? 86400 : 0, // 24 hours in production, no cache in dev
            staticAssets: isProduction ? 604800 : 0 // 7 days for static assets
        },
        
        // Analytics settings
        analytics: {
            googleAnalyticsId: isProduction ? 'G-XXXXXXXXXX' : null,
            trackingEnabled: isProduction || isStaging,
            debugMode: isDevelopment
        },
        
        // Get environment name
        getEnvironment: function() {
            if (isDevelopment) return 'development';
            if (isStaging) return 'staging';
            return 'production';
        },
        
        // Check if feature is enabled
        isFeatureEnabled: function(feature) {
            return this.features[feature] || false;
        },
        
        // Get API endpoint
        getApiUrl: function(endpoint) {
            return `${this.API_BASE_URL}${endpoint}`;
        }
    };
    
    // Freeze configuration in production
    if (isProduction) {
        Object.freeze(ENV);
        Object.freeze(ENV.features);
        Object.freeze(ENV.performance);
        Object.freeze(ENV.security);
        Object.freeze(ENV.cache);
        Object.freeze(ENV.analytics);
    }
    
    // Export to global scope
    window.ENV = ENV;
    
    // Setup console override based on environment
    if (!ENV.features.consoleLogging) {
        const noop = function() {};
        const methods = ['log', 'debug', 'info', 'warn', 'table', 'trace', 'group', 'groupEnd'];
        
        methods.forEach(method => {
            if (method !== 'error') { // Always allow error logging
                console[method] = noop;
            }
        });
    }
    
    // Log environment info in development
    if (isDevelopment) {
        console.log('%c🔧 Environment Configuration', 'color: #FF6B35; font-weight: bold; font-size: 14px');
        console.log('Environment:', ENV.getEnvironment());
        console.log('Features:', ENV.features);
        console.log('API Base:', ENV.API_BASE_URL);
    }
    
})();
