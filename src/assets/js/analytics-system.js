/**
 * CostFlowAI Analytics & A/B Testing System
 * Privacy-focused analytics with conversion tracking and experiment management
 */

class AnalyticsSystem {
    constructor(options = {}) {
        this.config = {
            trackingId: options.trackingId || 'CF-ANALYTICS-2025',
            apiEndpoint: options.apiEndpoint || '/api/analytics',
            enableGoogleAnalytics: options.enableGoogleAnalytics !== false,
            enableCustomAnalytics: options.enableCustomAnalytics !== false,
            privacyMode: options.privacyMode || false,
            batchSize: options.batchSize || 10,
            flushInterval: options.flushInterval || 30000, // 30 seconds
            debug: options.debug || false
        };

        // Event queue for batching
        this.eventQueue = [];
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        
        // A/B test assignments
        this.abTests = new Map();
        this.abTestConfig = null;
        
        // Conversion funnel tracking
        this.funnelSteps = new Map();
        
        // User properties
        this.userProperties = {
            subscription_plan: 'free',
            signup_date: null,
            feature_usage: {},
            referral_source: this.getReferralSource()
        };

        this.init();
    }

    async init() {
        try {
            // Load A/B test configuration
            await this.loadABTestConfig();
            
            // Setup A/B tests
            this.setupABTests();
            
            // Initialize tracking
            this.setupEventListeners();
            
            // Start batch flushing
            this.startBatchFlushing();
            
            // Track session start
            this.track('session_start', {
                referrer: document.referrer,
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            this.log('Analytics system initialized');
            
        } catch (error) {
            this.log(`Analytics initialization failed: ${error.message}`, 'error');
        }
    }

    /**
     * Track custom event
     */
    track(event, properties = {}) {
        if (this.config.privacyMode && this.isPrivacySensitive(event)) {
            return;
        }

        const eventData = {
            event,
            properties: {
                ...properties,
                session_id: this.sessionId,
                user_id: this.userId,
                timestamp: new Date().toISOString(),
                page_url: window.location.href,
                page_title: document.title,
                subscription_plan: this.userProperties.subscription_plan
            },
            ab_tests: Object.fromEntries(this.abTests)
        };

        // Add to queue
        this.eventQueue.push(eventData);
        
        // Send to Google Analytics if enabled
        if (this.config.enableGoogleAnalytics && typeof gtag !== 'undefined') {
            gtag('event', event, {
                ...properties,
                custom_parameter_1: this.abTests.get('pricing_test_2025'),
                custom_parameter_2: this.userProperties.subscription_plan
            });
        }

        // Flush if queue is full
        if (this.eventQueue.length >= this.config.batchSize) {
            this.flushEvents();
        }

        this.log(`Event tracked: ${event}`, 'debug');
    }

    /**
     * Track page view
     */
    trackPageView(page = null, properties = {}) {
        const pageData = {
            page: page || window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            ...properties
        };

        this.track('page_view', pageData);
    }

    /**
     * Track conversion event with value
     */
    trackConversion(event, value = 0, currency = 'USD', properties = {}) {
        const conversionData = {
            ...properties,
            value,
            currency,
            conversion_event: true
        };

        this.track(event, conversionData);

        // Also track in Google Analytics as conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: this.generateTransactionId(),
                value,
                currency,
                event_category: 'conversion',
                event_label: event
            });
        }
    }

    /**
     * Track funnel step
     */
    trackFunnelStep(funnel, step, properties = {}) {
        const funnelKey = `${funnel}_${step}`;
        
        if (!this.funnelSteps.has(funnelKey)) {
            this.funnelSteps.set(funnelKey, {
                timestamp: new Date().toISOString(),
                properties
            });
        }

        this.track('funnel_step', {
            funnel,
            step,
            ...properties
        });
    }

    /**
     * Track subscription lifecycle events
     */
    trackSubscriptionEvent(event, subscriptionData = {}) {
        const subscriptionEvents = [
            'subscription_started',
            'trial_started', 
            'trial_ended',
            'subscription_upgraded',
            'subscription_downgraded',
            'subscription_canceled',
            'subscription_reactivated',
            'payment_failed',
            'payment_succeeded'
        ];

        if (!subscriptionEvents.includes(event)) {
            this.log(`Unknown subscription event: ${event}`, 'warn');
        }

        // Update user properties
        if (subscriptionData.plan) {
            this.userProperties.subscription_plan = subscriptionData.plan;
        }

        this.track(event, subscriptionData);

        // Track as conversion for paid events
        const paidEvents = ['subscription_started', 'subscription_upgraded', 'payment_succeeded'];
        if (paidEvents.includes(event) && subscriptionData.value) {
            this.trackConversion(event, subscriptionData.value);
        }
    }

    /**
     * Track calculator usage
     */
    trackCalculatorUsage(calculatorId, inputs, result, executionTime) {
        const calculatorData = {
            calculator_id: calculatorId,
            state: inputs.state || 'US_DEFAULT',
            total_cost: result.totals?.withContingency || 0,
            line_item_count: result.lineItems?.length || 0,
            execution_time: executionTime,
            input_summary: this.summarizeInputs(inputs),
            premium_features_used: this.detectPremiumFeatures(result)
        };

        this.track('calculator_used', calculatorData);

        // Track feature usage
        if (!this.userProperties.feature_usage[calculatorId]) {
            this.userProperties.feature_usage[calculatorId] = 0;
        }
        this.userProperties.feature_usage[calculatorId]++;

        // Update Mixpanel people properties if available
        if (typeof mixpanel !== 'undefined' && mixpanel.people) {
            mixpanel.people.increment(`calculator_${calculatorId}_count`);
            mixpanel.people.set_once('first_calculator_used', calculatorId);
        }
    }

    /**
     * Load A/B test configuration
     */
    async loadABTestConfig() {
        try {
            const response = await fetch('/config/pricing.json');
            const config = await response.json();
            this.abTestConfig = config.ab_tests || {};
            
            this.log('A/B test config loaded');
            
        } catch (error) {
            this.log(`Failed to load A/B test config: ${error.message}`, 'error');
            this.abTestConfig = {};
        }
    }

    /**
     * Setup A/B tests for user
     */
    setupABTests() {
        for (const [testName, testConfig] of Object.entries(this.abTestConfig)) {
            if (testConfig.enabled) {
                const variant = this.assignABTestVariant(testName, testConfig);
                this.abTests.set(testName, variant);
                
                // Track assignment
                this.track('ab_test_assigned', {
                    test_name: testName,
                    variant: variant,
                    test_config: testConfig
                });
                
                this.log(`A/B test assigned: ${testName} = ${variant}`);
            }
        }
    }

    /**
     * Assign A/B test variant to user
     */
    assignABTestVariant(testName, testConfig) {
        // Check if user already has assignment
        const existingAssignment = localStorage.getItem(`ab_test_${testName}`);
        if (existingAssignment) {
            return existingAssignment;
        }

        // Generate new assignment
        const hash = this.hashString(this.userId + testName);
        const bucket = hash % 100;
        
        let cumulativeWeight = 0;
        for (const [variant, weight] of Object.entries(testConfig.traffic_split)) {
            cumulativeWeight += weight;
            if (bucket < cumulativeWeight) {
                // Save assignment
                localStorage.setItem(`ab_test_${testName}`, variant);
                return variant;
            }
        }
        
        return 'control';
    }

    /**
     * Get A/B test variant for user
     */
    getABTestVariant(testName) {
        return this.abTests.get(testName) || 'control';
    }

    /**
     * Track A/B test conversion
     */
    trackABTestConversion(testName, conversionEvent, properties = {}) {
        const variant = this.getABTestVariant(testName);
        
        this.track('ab_test_conversion', {
            test_name: testName,
            variant: variant,
            conversion_event: conversionEvent,
            ...properties
        });
    }

    /**
     * Setup automatic event listeners
     */
    setupEventListeners() {
        // Track page views on navigation
        let currentPath = window.location.pathname;
        
        // Handle SPA navigation
        const handleNavigation = () => {
            if (window.location.pathname !== currentPath) {
                currentPath = window.location.pathname;
                this.trackPageView();
            }
        };

        // Listen for history changes
        window.addEventListener('popstate', handleNavigation);
        
        // Override pushState and replaceState
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            originalPushState.apply(this, args);
            handleNavigation();
        };
        
        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            handleNavigation();
        };

        // Track clicks on important elements
        document.addEventListener('click', (e) => {
            // Track CTA button clicks
            if (e.target.matches('.btn-premium, .btn-upgrade, .btn-trial')) {
                this.track('cta_clicked', {
                    button_text: e.target.textContent.trim(),
                    button_class: e.target.className,
                    page: window.location.pathname
                });
            }
            
            // Track calculator navigation
            if (e.target.closest('.calc-card')) {
                const calculatorName = e.target.closest('.calc-card').querySelector('h3')?.textContent || 'unknown';
                this.track('calculator_navigation_clicked', {
                    calculator_name: calculatorName,
                    is_premium: e.target.closest('.calc-card').hasAttribute('data-premium')
                });
            }
            
            // Track external link clicks
            if (e.target.tagName === 'A' && e.target.hostname !== window.location.hostname) {
                this.track('external_link_clicked', {
                    url: e.target.href,
                    text: e.target.textContent.trim()
                });
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('form[data-feature="calculation"]')) {
                this.track('calculation_form_submitted', {
                    form_id: e.target.id,
                    calculator_type: e.target.dataset.calculatorType || 'unknown'
                });
            }
        });

        // Track time on page
        let pageStartTime = Date.now();
        let isVisible = true;
        
        document.addEventListener('visibilitychange', () => {
            const now = Date.now();
            
            if (document.hidden && isVisible) {
                // Page became hidden
                const timeOnPage = now - pageStartTime;
                this.track('page_time', {
                    time_on_page: timeOnPage,
                    page: window.location.pathname
                });
                isVisible = false;
            } else if (!document.hidden && !isVisible) {
                // Page became visible
                pageStartTime = now;
                isVisible = true;
            }
        });

        // Track before unload
        window.addEventListener('beforeunload', () => {
            if (isVisible) {
                const timeOnPage = Date.now() - pageStartTime;
                this.track('page_time', {
                    time_on_page: timeOnPage,
                    page: window.location.pathname
                });
            }
            
            // Flush remaining events
            this.flushEvents(true);
        });

        // Track scroll depth
        let maxScrollPercent = 0;
        const trackScroll = this.throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScrollPercent) {
                maxScrollPercent = scrollPercent;
                
                // Track at 25%, 50%, 75%, 100%
                const milestones = [25, 50, 75, 100];
                const milestone = milestones.find(m => scrollPercent >= m && maxScrollPercent < m);
                
                if (milestone) {
                    this.track('scroll_depth', {
                        percent: milestone,
                        page: window.location.pathname
                    });
                }
            }
        }, 1000);
        
        window.addEventListener('scroll', trackScroll, { passive: true });
    }

    /**
     * Flush events to server
     */
    async flushEvents(sync = false) {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        try {
            if (this.config.enableCustomAnalytics) {
                const payload = {
                    events,
                    session_id: this.sessionId,
                    user_id: this.userId,
                    user_properties: this.userProperties,
                    ab_tests: Object.fromEntries(this.abTests),
                    timestamp: new Date().toISOString()
                };

                if (sync && navigator.sendBeacon) {
                    // Synchronous send for page unload
                    navigator.sendBeacon(
                        this.config.apiEndpoint,
                        JSON.stringify(payload)
                    );
                } else {
                    // Asynchronous send
                    fetch(this.config.apiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }).catch(error => {
                        this.log(`Failed to send events: ${error.message}`, 'error');
                        // Re-add events to queue for retry
                        this.eventQueue.unshift(...events);
                    });
                }
            }

            this.log(`Flushed ${events.length} events`);
            
        } catch (error) {
            this.log(`Event flush failed: ${error.message}`, 'error');
            // Re-add events to queue
            this.eventQueue.unshift(...events);
        }
    }

    /**
     * Start automatic event flushing
     */
    startBatchFlushing() {
        setInterval(() => {
            this.flushEvents();
        }, this.config.flushInterval);
    }

    /**
     * Set user properties
     */
    setUserProperties(properties) {
        Object.assign(this.userProperties, properties);
        
        // Update Mixpanel if available
        if (typeof mixpanel !== 'undefined' && mixpanel.people) {
            mixpanel.people.set(properties);
        }
        
        this.track('user_properties_updated', properties);
    }

    /**
     * Identify user (after signup/login)
     */
    identify(userId, properties = {}) {
        this.userId = userId;
        this.setUserProperties(properties);
        
        // Update Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('config', this.config.trackingId, {
                user_id: userId
            });
        }
        
        // Update Mixpanel
        if (typeof mixpanel !== 'undefined') {
            mixpanel.identify(userId);
        }
        
        this.track('user_identified', { user_id: userId });
    }

    /**
     * Reset user (logout)
     */
    reset() {
        this.userId = this.generateUserId();
        this.sessionId = this.generateSessionId();
        this.userProperties = {
            subscription_plan: 'free',
            signup_date: null,
            feature_usage: {},
            referral_source: this.getReferralSource()
        };
        
        // Clear A/B test assignments
        Object.keys(this.abTestConfig).forEach(testName => {
            localStorage.removeItem(`ab_test_${testName}`);
        });
        this.abTests.clear();
        this.setupABTests();
        
        this.track('user_reset');
    }

    /**
     * Utility functions
     */
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateUserId() {
        let userId = localStorage.getItem('costflowai_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('costflowai_user_id', userId);
        }
        return userId;
    }

    getUserId() {
        return this.generateUserId(); // Will return existing if available
    }

    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getReferralSource() {
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');
        const utmCampaign = urlParams.get('utm_campaign');
        
        if (utmSource) {
            return {
                source: utmSource,
                medium: utmMedium,
                campaign: utmCampaign
            };
        }
        
        const referrer = document.referrer;
        if (referrer) {
            try {
                const referrerDomain = new URL(referrer).hostname;
                return {
                    source: referrerDomain,
                    medium: 'referral'
                };
            } catch (e) {
                return { source: 'direct' };
            }
        }
        
        return { source: 'direct' };
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    isPrivacySensitive(event) {
        const sensitiveEvents = [
            'user_email_captured',
            'payment_info_entered',
            'personal_data_viewed'
        ];
        return sensitiveEvents.includes(event);
    }

    summarizeInputs(inputs) {
        // Create a summary without sensitive data
        const summary = {};
        const allowedFields = ['sqft', 'state', 'quality', 'buildingType', 'stories'];
        
        allowedFields.forEach(field => {
            if (inputs[field] !== undefined) {
                summary[field] = inputs[field];
            }
        });
        
        return summary;
    }

    detectPremiumFeatures(result) {
        const features = [];
        
        if (result.sensitivityAnalysis) features.push('sensitivity_analysis');
        if (result.whatIfScenarios) features.push('what_if_scenarios');
        if (result.csiMapping) features.push('csi_mapping');
        if (result.lineItems && result.lineItems.length > 5) features.push('detailed_line_items');
        
        return features;
    }

    log(message, level = 'info') {
        if (this.config.debug) {
            console[level](`[Analytics] ${message}`);
        }
    }
}

// Conversion funnel helpers
class ConversionFunnel {
    static SUBSCRIPTION_FUNNEL = {
        VIEWED_PRICING: 'viewed_pricing',
        CLICKED_UPGRADE: 'clicked_upgrade', 
        STARTED_CHECKOUT: 'started_checkout',
        COMPLETED_PAYMENT: 'completed_payment'
    };

    static CALCULATOR_FUNNEL = {
        VIEWED_CALCULATOR: 'viewed_calculator',
        STARTED_CALCULATION: 'started_calculation',
        COMPLETED_CALCULATION: 'completed_calculation',
        EXPORTED_RESULTS: 'exported_results'
    };
}

// Heat mapping helper (simple implementation)
class HeatMapTracker {
    constructor(analytics) {
        this.analytics = analytics;
        this.clicks = [];
        this.movements = [];
        this.setupTracking();
    }

    setupTracking() {
        // Track clicks with coordinates
        document.addEventListener('click', (e) => {
            const clickData = {
                x: e.clientX,
                y: e.clientY,
                element: e.target.tagName,
                page: window.location.pathname,
                timestamp: Date.now()
            };
            
            this.clicks.push(clickData);
            
            // Send batch every 10 clicks
            if (this.clicks.length >= 10) {
                this.analytics.track('heatmap_clicks', { clicks: this.clicks });
                this.clicks = [];
            }
        });

        // Track mouse movements (sampled)
        let lastMovement = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastMovement > 1000) { // Sample every second
                this.movements.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: now
                });
                lastMovement = now;
                
                // Keep only last 50 movements
                if (this.movements.length > 50) {
                    this.movements = this.movements.slice(-50);
                }
            }
        });

        // Send movement data on page unload
        window.addEventListener('beforeunload', () => {
            if (this.movements.length > 0) {
                this.analytics.track('heatmap_movements', { 
                    movements: this.movements,
                    page: window.location.pathname
                });
            }
        });
    }
}

// Initialize analytics system
let analyticsSystem = null;

document.addEventListener('DOMContentLoaded', () => {
    analyticsSystem = new AnalyticsSystem({
        trackingId: 'CF-ANALYTICS-2025',
        enableGoogleAnalytics: true,
        enableCustomAnalytics: true,
        debug: window.location.hostname === 'localhost'
    });

    // Setup heat mapping
    new HeatMapTracker(analyticsSystem);

    // Make globally available
    window.analytics = analyticsSystem;
    window.ConversionFunnel = ConversionFunnel;
    
    // Track initial page view
    analyticsSystem.trackPageView();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalyticsSystem, ConversionFunnel, HeatMapTracker };
}