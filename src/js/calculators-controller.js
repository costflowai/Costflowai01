/**
 * CostFlowAI Calculator Controller
 * Handles all calculator functionality and navigation
 * Resolves "showCalculator is not defined" errors
 */

(function(window) {
    'use strict';

    // Calculator Controller System
    const CalculatorController = {
        // Map calculator types to their URLs/paths
        calculators: {
            concrete: '/calculators/concrete',
            framing: '/calculators/framing',
            drywall: '/calculators/drywall',
            paint: '/calculators/paint',
            roofing: '/calculators/roofing',
            flooring: '/calculators/flooring',
            electrical: '/calculators/electrical',
            plumbing: '/calculators/plumbing',
            hvac: '/calculators/hvac',
            insulation: '/calculators/insulation',
            excavation: '/calculators/excavation',
            labor: '/calculators/labor',
            'material-waste': '/calculators/material-waste',
            'finish-carpentry': '/calculators/finish-carpentry',
            'retaining-wall': '/calculators/retaining-wall',
            'cash-flow': '/calculators/cash-flow'
        },

        // Current active calculator for tab systems
        activeCalculator: 'concrete',

        // Initialize the controller
        init() {
            console.log('CalculatorController initializing...');
            
            // Set up global functions
            this.setupGlobalFunctions();
            
            // Set up event delegation
            this.attachEventListeners();
            
            // Fix existing buttons
            this.fixLegacyButtons();
            
            // Set up error handling
            this.setupErrorHandling();
            
            console.log('CalculatorController initialized successfully');
            return this;
        },

        // Set up global functions for backward compatibility
        setupGlobalFunctions() {
            // Global showCalculator function
            window.showCalculator = (type) => {
                return this.showCalculator(type);
            };

            // Alternative function names for compatibility
            window.openCalculator = (type) => {
                return this.showCalculator(type);
            };

            window.navigateToCalculator = (type) => {
                return this.showCalculator(type);
            };

            console.log('Global calculator functions registered');
        },

        // Main calculator navigation function
        showCalculator(type, options = {}) {
            console.log(`showCalculator called with type: ${type}`);
            
            try {
                if (!type) {
                    console.error('Calculator type not provided');
                    this.showError('Calculator type not specified');
                    return false;
                }

                // Clean the type parameter
                type = type.toLowerCase().trim();

                // Check if we're on a multi-calculator page (tabs)
                if (this.isTabSystem()) {
                    return this.handleTabSystem(type, options);
                }

                // Navigate to individual calculator page
                return this.navigateToCalculator(type, options);

            } catch (error) {
                console.error('Error in showCalculator:', error);
                this.showError(`Failed to load calculator: ${error.message}`);
                return false;
            }
        },

        // Check if current page uses tab system
        isTabSystem() {
            return document.querySelector('.calculator-panel') !== null ||
                   document.querySelector('.tab-btn') !== null;
        },

        // Handle tab-based calculator system
        handleTabSystem(type, options = {}) {
            console.log(`Handling tab system for: ${type}`);

            // Update active calculator
            this.activeCalculator = type;

            // Hide all panels
            document.querySelectorAll('.calculator-panel').forEach(panel => {
                panel.classList.remove('active');
            });

            // Remove active state from all buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected panel
            const panel = document.getElementById(type + '-calc');
            if (panel) {
                panel.classList.add('active');
                
                // Activate corresponding button
                const button = document.querySelector(`[onclick*="${type}"]`);
                if (button) {
                    button.classList.add('active');
                }

                // Track usage
                this.trackCalculatorUse(type);
                
                console.log(`Activated tab: ${type}`);
                return true;
            } else {
                console.warn(`Panel not found: ${type}-calc`);
                // Fallback to navigation
                return this.navigateToCalculator(type, options);
            }
        },

        // Navigate to individual calculator page
        navigateToCalculator(type, options = {}) {
            console.log(`Navigating to calculator: ${type}`);

            const url = this.calculators[type];
            if (url) {
                // Add loading state
                this.showLoadingState(type);
                
                // Navigate to calculator page
                if (options.newTab) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                } else {
                    window.location.href = url;
                }
                
                return true;
            } else {
                console.error(`Calculator not found: ${type}`);
                this.showError(`Calculator "${type}" not available`);
                return false;
            }
        },

        // Set up event delegation for dynamic content
        attachEventListeners() {
            // Handle clicks on calculator buttons
            document.addEventListener('click', (e) => {
                // Calculator buttons with data attributes
                if (e.target.matches('[data-calculator]')) {
                    e.preventDefault();
                    const type = e.target.dataset.calculator;
                    this.showCalculator(type);
                    return;
                }

                // Calculator buttons with data-calculator-type
                if (e.target.matches('[data-calculator-type]')) {
                    e.preventDefault();
                    const type = e.target.dataset.calculatorType;
                    this.showCalculator(type);
                    return;
                }

                // Legacy calculator buttons
                if (e.target.matches('.calculator-btn')) {
                    e.preventDefault();
                    const type = e.target.getAttribute('data-type') || 
                               e.target.getAttribute('data-calc') ||
                               e.target.textContent.toLowerCase().trim();
                    this.showCalculator(type);
                    return;
                }
            });

            console.log('Event delegation set up');
        },

        // Fix existing legacy buttons
        fixLegacyButtons() {
            // Add data attributes to existing buttons for better compatibility
            const buttons = document.querySelectorAll('button[onclick*="showCalculator"]');
            buttons.forEach(button => {
                const onclickAttr = button.getAttribute('onclick');
                const match = onclickAttr.match(/showCalculator\(['"]([^'"]+)['"]\)/);
                if (match) {
                    const type = match[1];
                    button.setAttribute('data-calculator-type', type);
                    // Keep onclick for backward compatibility
                }
            });

            console.log(`Fixed ${buttons.length} legacy buttons`);
        },

        // Set up comprehensive error handling
        setupErrorHandling() {
            // Global error handler for calculator-related errors
            window.addEventListener('error', (e) => {
                if (e.message && e.message.includes('showCalculator')) {
                    console.error('Calculator error detected, applying emergency fix...', e);
                    this.applyEmergencyFix();
                }
            });

            // Unhandled promise rejection handler
            window.addEventListener('unhandledrejection', (e) => {
                if (e.reason && e.reason.message && e.reason.message.includes('calculator')) {
                    console.error('Calculator promise rejection:', e.reason);
                }
            });
        },

        // Emergency fix for missing functions
        applyEmergencyFix() {
            console.warn('Applying emergency calculator fix...');
            
            // Ensure global function exists
            if (typeof window.showCalculator !== 'function') {
                window.showCalculator = (type) => {
                    console.log(`Emergency showCalculator for: ${type}`);
                    const url = this.calculators[type] || `/calculators/${type}`;
                    window.location.href = url;
                };
                console.log('Emergency showCalculator function created');
            }
        },

        // Show loading state
        showLoadingState(type) {
            // Create or update loading indicator
            let loader = document.getElementById('calculator-loader');
            if (!loader) {
                loader = document.createElement('div');
                loader.id = 'calculator-loader';
                loader.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        z-index: 10000;
                        text-align: center;
                    ">
                        <div style="width: 40px; height: 40px; margin: 0 auto 10px; border: 4px solid #f3f3f3; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p>Loading ${type} calculator...</p>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `;
                document.body.appendChild(loader);
            }

            // Remove loader after timeout as fallback
            setTimeout(() => {
                if (loader && loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            }, 5000);
        },

        // Show error message to user
        showError(message) {
            console.error('Calculator Error:', message);
            
            // Create error notification
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #dc3545;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 5px;
                    z-index: 10001;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    max-width: 350px;
                ">
                    <strong>Calculator Error:</strong><br>
                    ${message}
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        float: right;
                        background: none;
                        border: none;
                        color: white;
                        font-size: 18px;
                        cursor: pointer;
                        margin-left: 10px;
                    ">×</button>
                </div>
            `;
            
            document.body.appendChild(errorDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorDiv && errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        },

        // Track calculator usage for analytics
        trackCalculatorUse(type) {
            try {
                // Google Analytics 4
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'calculator_use', {
                        'calculator_type': type,
                        'event_category': 'calculators'
                    });
                }

                // Custom analytics
                if (window.CostFlowAnalytics && window.CostFlowAnalytics.track) {
                    window.CostFlowAnalytics.track('calculator_use', { type });
                }

                console.log(`Tracked calculator use: ${type}`);
            } catch (error) {
                console.warn('Analytics tracking failed:', error);
            }
        },

        // Get all available calculators
        getAvailableCalculators() {
            return Object.keys(this.calculators);
        },

        // Validate calculator type
        isValidCalculatorType(type) {
            return this.calculators.hasOwnProperty(type.toLowerCase());
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            CalculatorController.init();
        });
    } else {
        // DOM already loaded
        CalculatorController.init();
    }

    // Export for global access
    window.CalculatorController = CalculatorController;

    // Immediate global function setup for backwards compatibility
    window.showCalculator = window.showCalculator || function(type) {
        console.log('Immediate showCalculator called:', type);
        if (window.CalculatorController) {
            return window.CalculatorController.showCalculator(type);
        } else {
            // Fallback navigation
            const url = `/calculators/${type}`;
            console.log(`Fallback navigation to: ${url}`);
            window.location.href = url;
        }
    };

    console.log('Calculator system loaded successfully');

})(window);