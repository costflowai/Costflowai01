/**
 * Calculator Integration Helper
 * Easy integration with existing calculator functions
 */

/**
 * Wrap any calculator function with usage tracking
 * @param {Function} originalFunction - The original calculator function
 * @param {string} calculatorType - Type identifier for the calculator
 * @returns {Function} Wrapped function with usage tracking
 */
function withUsageTracking(originalFunction, calculatorType) {
    return async function(...args) {
        // Check if usage limiter is available
        if (!window.usageLimiterInstance) {
            console.warn('Usage limiter not initialized, allowing unlimited access');
            return originalFunction.apply(this, args);
        }
        
        // Check if user can use the calculator
        const canUse = await window.usageLimiterInstance.trackUsage(calculatorType);
        
        if (!canUse) {
            // Usage limit reached, modal should already be shown
            return false;
        }
        
        // Allow calculator to run
        try {
            const result = originalFunction.apply(this, args);
            
            // Track successful calculation for analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'calculate', {
                    event_category: 'Calculator',
                    event_label: calculatorType,
                    value: 1
                });
            }
            
            return result;
        } catch (error) {
            console.error('Calculator error:', error);
            throw error;
        }
    };
}

/**
 * Simple integration for calculator buttons
 * Call this function when a calculator button is clicked
 * @param {string} calculatorType - Type identifier for the calculator
 * @param {Function} calculatorFunction - Function to run if usage allowed
 */
async function checkUsageAndCalculate(calculatorType, calculatorFunction) {
    // TEMPORARILY DISABLED: All calculators are free during Stripe setup
    console.log('Usage limits temporarily disabled - all calculators are free');
    return calculatorFunction();
    
    // Original usage limiting code (commented out)
    /*
    if (!window.usageLimiterInstance) {
        console.warn('Usage limiter not initialized');
        return calculatorFunction();
    }
    
    const canUse = await window.usageLimiterInstance.trackUsage(calculatorType);
    
    if (canUse) {
        return calculatorFunction();
    }
    
    return false;
    */
}

/**
 * Auto-wrap all calculator functions on a page
 * This function finds common calculator patterns and wraps them
 */
function autoWrapCalculators() {
    // Common calculator function patterns
    const calculatorPatterns = [
        'calculate',
        'compute',
        'estimate',
        'calc'
    ];
    
    // Find and wrap global calculator functions
    calculatorPatterns.forEach(pattern => {
        Object.keys(window).forEach(key => {
            if (key.toLowerCase().includes(pattern) && typeof window[key] === 'function') {
                const originalFunc = window[key];
                const calculatorType = key.replace(/^(calculate|compute|estimate|calc)/i, '').toLowerCase();
                
                window[key] = withUsageTracking(originalFunc, calculatorType || 'general');
                console.log(`Wrapped calculator function: ${key}`);
            }
        });
    });
    
    // Wrap button click handlers
    const calculatorButtons = document.querySelectorAll('[class*="calc"], [id*="calc"], [class*="calculate"], [id*="calculate"], [class*="estimate"], [id*="estimate"]');
    
    calculatorButtons.forEach(button => {
        // Skip if already wrapped
        if (button.hasAttribute('data-usage-wrapped')) return;
        
        const calculatorType = button.className || button.id || 'general';
        
        // Store original click handler
        const originalHandler = button.onclick;
        
        button.onclick = async function(event) {
            if (!window.usageLimiterInstance) {
                return originalHandler ? originalHandler.call(this, event) : true;
            }
            
            const canUse = await window.usageLimiterInstance.trackUsage(calculatorType);
            
            if (canUse && originalHandler) {
                return originalHandler.call(this, event);
            } else if (!canUse) {
                event.preventDefault();
                return false;
            }
            
            return true;
        };
        
        button.setAttribute('data-usage-wrapped', 'true');
        console.log(`Wrapped calculator button: ${calculatorType}`);
    });
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to load
    setTimeout(autoWrapCalculators, 1000);
});

// Export for manual use
window.withUsageTracking = withUsageTracking;
window.checkUsageAndCalculate = checkUsageAndCalculate;
window.autoWrapCalculators = autoWrapCalculators;