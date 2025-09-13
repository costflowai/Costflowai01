/**
 * CostFlowAI Advanced Analytics & Conversion Tracking System
 * Comprehensive user behavior tracking for optimization
 */

class CostFlowAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.startTime = Date.now();
        this.events = [];
        this.heatmapData = [];
        this.conversionFunnel = {
            landing: false,
            calculator_view: false,
            calculator_use: false,
            result_view: false,
            lead_capture: false,
            conversion: false
        };
        
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupEventListeners();
        this.startSessionTracking();
        this.trackScrollDepth();
        this.trackTimeOnPage();
        this.setupHeatmapTracking();
        this.trackDeviceInfo();
        this.trackReferralSource();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
        let userId = localStorage.getItem('costflow_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('costflow_user_id', userId);
        }
        return userId;
    }

    trackEvent(eventName, properties = {}) {
        const event = {
            event: eventName,
            properties: {
                ...properties,
                session_id: this.sessionId,
                user_id: this.userId,
                timestamp: Date.now(),
                page_url: window.location.href,
                page_title: document.title,
                referrer: document.referrer
            }
        };

        this.events.push(event);

        // Send to Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }

        // Send to custom analytics endpoint
        this.sendToAnalytics(event);

        // Update conversion funnel
        this.updateConversionFunnel(eventName);

        console.log('📊 Analytics Event:', event);
    }

    updateConversionFunnel(eventName) {
        const funnelMapping = {
            'page_view': 'landing',
            'calculator_viewed': 'calculator_view',
            'calculator_used': 'calculator_use',
            'results_viewed': 'result_view',
            'email_captured': 'lead_capture',
            'trial_started': 'conversion',
            'contact_form_submitted': 'conversion'
        };

        if (funnelMapping[eventName]) {
            this.conversionFunnel[funnelMapping[eventName]] = true;
            this.trackEvent('funnel_progression', {
                stage: funnelMapping[eventName],
                funnel_data: this.conversionFunnel
            });
        }
    }

    trackPageView() {
        this.trackEvent('page_view', {
            page_type: this.getPageType(),
            is_mobile: this.isMobile(),
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`
        });
    }

    getPageType() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'homepage';
        if (path.includes('/calculators/')) return 'calculator';
        if (path.includes('/blog/')) return 'blog';
        if (path.includes('/photo-estimate')) return 'photo_estimator';
        if (path.includes('/intelligence-dashboard')) return 'intelligence_dashboard';
        if (path.includes('/roi-maximizer')) return 'roi_calculator';
        return 'other';
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    setupEventListeners() {
        // Calculator interactions
        this.trackCalculatorEvents();
        
        // Form interactions
        this.trackFormEvents();
        
        // Button clicks
        this.trackButtonClicks();
        
        // Navigation tracking
        this.trackNavigationEvents();
        
        // Exit intent
        this.trackExitIntent();
        
        // Scroll-based events
        this.trackScrollEvents();
    }

    trackCalculatorEvents() {
        // Track calculator form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('calculator-form') || 
                e.target.id.includes('calculator') || 
                e.target.id.includes('Calculator')) {
                
                const formData = new FormData(e.target);
                const calculatorType = this.getCalculatorType();
                
                this.trackEvent('calculator_used', {
                    calculator_type: calculatorType,
                    form_data: Object.fromEntries(formData),
                    time_to_submit: Date.now() - this.startTime
                });
            }
        });

        // Track input changes in calculators
        document.addEventListener('input', (e) => {
            if (e.target.closest('.calculator-form')) {
                this.trackEvent('calculator_input_changed', {
                    field_name: e.target.name || e.target.id,
                    field_value: e.target.value,
                    calculator_type: this.getCalculatorType()
                });
            }
        });
    }

    getCalculatorType() {
        const path = window.location.pathname;
        if (path.includes('residential')) return 'residential_rom';
        if (path.includes('commercial')) return 'commercial_ti';
        if (path.includes('concrete')) return 'concrete';
        if (path.includes('roi-maximizer')) return 'roi_maximizer';
        if (path.includes('photo-estimate')) return 'photo_estimator';
        return 'unknown';
    }

    trackFormEvents() {
        // Email capture forms
        document.addEventListener('submit', (e) => {
            const emailInput = e.target.querySelector('input[type="email"]');
            if (emailInput) {
                this.trackEvent('email_captured', {
                    email: emailInput.value,
                    form_source: this.getFormSource(e.target),
                    time_on_page: Date.now() - this.startTime
                });
            }
        });

        // Contact forms
        document.addEventListener('submit', (e) => {
            if (e.target.id.includes('contact') || e.target.classList.contains('contact-form')) {
                this.trackEvent('contact_form_submitted', {
                    form_source: window.location.pathname,
                    time_on_page: Date.now() - this.startTime
                });
            }
        });
    }

    getFormSource(form) {
        const formId = form.id;
        const formClass = form.className;
        const parent = form.closest('[id], [class*="section"]');
        
        if (formId) return formId;
        if (formClass) return formClass.split(' ')[0];
        if (parent) return parent.id || parent.className.split(' ')[0];
        return 'unknown';
    }

    trackButtonClicks() {
        document.addEventListener('click', (e) => {
            // CTA buttons
            if (e.target.classList.contains('btn-primary') || 
                e.target.classList.contains('cta-button') ||
                e.target.textContent.includes('Free Trial') ||
                e.target.textContent.includes('Get Started')) {
                
                this.trackEvent('cta_clicked', {
                    button_text: e.target.textContent.trim(),
                    button_position: this.getElementPosition(e.target),
                    page_section: this.getPageSection(e.target)
                });
            }

            // Download buttons
            if (e.target.textContent.includes('Download') ||
                e.target.textContent.includes('PDF') ||
                e.target.textContent.includes('Report')) {
                
                this.trackEvent('download_clicked', {
                    download_type: e.target.textContent.trim(),
                    source_page: window.location.pathname
                });
            }

            // Share buttons
            if (e.target.classList.contains('share-btn') ||
                e.target.textContent.includes('Share') ||
                e.target.textContent.includes('Facebook') ||
                e.target.textContent.includes('Twitter')) {
                
                this.trackEvent('share_clicked', {
                    platform: this.getSharePlatform(e.target),
                    content_type: this.getPageType()
                });
            }
        });
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            viewport_position: `${Math.round(rect.top)}px from top`
        };
    }

    getPageSection(element) {
        const section = element.closest('section, .section, [class*="section"]');
        if (section) {
            return section.className || section.id || 'unnamed_section';
        }
        return 'no_section';
    }

    getSharePlatform(element) {
        const text = element.textContent.toLowerCase();
        if (text.includes('facebook')) return 'facebook';
        if (text.includes('twitter')) return 'twitter';
        if (text.includes('linkedin')) return 'linkedin';
        if (text.includes('email')) return 'email';
        return 'unknown';
    }

    trackNavigationEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A' && e.target.href) {
                const isExternal = !e.target.href.includes(window.location.hostname);
                const isDownload = e.target.download || e.target.href.includes('.pdf') || 
                                 e.target.href.includes('.zip') || e.target.href.includes('.doc');
                
                this.trackEvent('link_clicked', {
                    link_url: e.target.href,
                    link_text: e.target.textContent.trim(),
                    is_external: isExternal,
                    is_download: isDownload,
                    link_position: this.getElementPosition(e.target)
                });
            }
        });
    }

    trackExitIntent() {
        let exitIntentShown = false;
        
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 0 && !exitIntentShown) {
                exitIntentShown = true;
                this.trackEvent('exit_intent', {
                    time_on_page: Date.now() - this.startTime,
                    scroll_depth: this.getScrollDepth(),
                    page_engagement: this.calculateEngagement()
                });
            }
        });
    }

    trackScrollEvents() {
        let scrollTimeout;
        let maxScrollDepth = 0;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            const currentScroll = this.getScrollDepth();
            maxScrollDepth = Math.max(maxScrollDepth, currentScroll);
            
            scrollTimeout = setTimeout(() => {
                // Track significant scroll milestones
                if (currentScroll >= 25 && !this.scrollMilestones?.quarter) {
                    this.scrollMilestones = { ...this.scrollMilestones, quarter: true };
                    this.trackEvent('scroll_milestone', { depth: 25 });
                }
                if (currentScroll >= 50 && !this.scrollMilestones?.half) {
                    this.scrollMilestones = { ...this.scrollMilestones, half: true };
                    this.trackEvent('scroll_milestone', { depth: 50 });
                }
                if (currentScroll >= 75 && !this.scrollMilestones?.three_quarter) {
                    this.scrollMilestones = { ...this.scrollMilestones, three_quarter: true };
                    this.trackEvent('scroll_milestone', { depth: 75 });
                }
                if (currentScroll >= 90 && !this.scrollMilestones?.near_bottom) {
                    this.scrollMilestones = { ...this.scrollMilestones, near_bottom: true };
                    this.trackEvent('scroll_milestone', { depth: 90 });
                }
            }, 100);
        });
    }

    getScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return Math.round((scrollTop + windowHeight) / documentHeight * 100);
    }

    trackScrollDepth() {
        // Already implemented in trackScrollEvents
        this.scrollMilestones = {};
    }

    trackTimeOnPage() {
        // Track time on page in intervals
        setInterval(() => {
            const timeOnPage = Date.now() - this.startTime;
            
            // Track engagement milestones
            if (timeOnPage >= 30000 && !this.timeMilestones?.thirty_seconds) {
                this.timeMilestones = { ...this.timeMilestones, thirty_seconds: true };
                this.trackEvent('engagement_milestone', { time: '30_seconds' });
            }
            if (timeOnPage >= 120000 && !this.timeMilestones?.two_minutes) {
                this.timeMilestones = { ...this.timeMilestones, two_minutes: true };
                this.trackEvent('engagement_milestone', { time: '2_minutes' });
            }
            if (timeOnPage >= 300000 && !this.timeMilestones?.five_minutes) {
                this.timeMilestones = { ...this.timeMilestones, five_minutes: true };
                this.trackEvent('engagement_milestone', { time: '5_minutes' });
            }
        }, 10000); // Check every 10 seconds
        
        this.timeMilestones = {};
    }

    setupHeatmapTracking() {
        // Track clicks for heatmap generation
        document.addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            this.heatmapData.push({
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                timestamp: Date.now(),
                element: e.target.tagName,
                page: window.location.pathname
            });
        });

        // Track mouse movements (sampled)
        let mouseMoveCount = 0;
        document.addEventListener('mousemove', (e) => {
            mouseMoveCount++;
            if (mouseMoveCount % 10 === 0) { // Sample every 10th movement
                this.heatmapData.push({
                    x: e.pageX,
                    y: e.pageY,
                    timestamp: Date.now(),
                    type: 'movement',
                    page: window.location.pathname
                });
            }
        });
    }

    trackDeviceInfo() {
        this.trackEvent('device_info', {
            user_agent: navigator.userAgent,
            language: navigator.language,
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            color_depth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            connection: this.getConnectionInfo()
        });
    }

    getConnectionInfo() {
        if ('connection' in navigator) {
            return {
                effective_type: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return null;
    }

    trackReferralSource() {
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');
        const utmCampaign = urlParams.get('utm_campaign');
        
        if (utmSource || document.referrer) {
            this.trackEvent('referral_source', {
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                referrer: document.referrer,
                organic_search: this.isOrganicSearch(document.referrer)
            });
        }
    }

    isOrganicSearch(referrer) {
        const searchEngines = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com'];
        return searchEngines.some(engine => referrer.includes(engine));
    }

    startSessionTracking() {
        // Track session start
        this.trackEvent('session_start', {
            is_returning_visitor: this.isReturningVisitor(),
            previous_visit: localStorage.getItem('costflow_last_visit'),
            visit_count: this.getVisitCount()
        });

        // Update visit tracking
        localStorage.setItem('costflow_last_visit', Date.now().toString());
        this.incrementVisitCount();

        // Track session end on page unload
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session_end', {
                session_duration: Date.now() - this.startTime,
                max_scroll_depth: this.getScrollDepth(),
                page_views: this.events.filter(e => e.event === 'page_view').length,
                interactions: this.events.filter(e => e.event.includes('click')).length
            });
        });
    }

    isReturningVisitor() {
        return localStorage.getItem('costflow_last_visit') !== null;
    }

    getVisitCount() {
        return parseInt(localStorage.getItem('costflow_visit_count') || '0');
    }

    incrementVisitCount() {
        const count = this.getVisitCount() + 1;
        localStorage.setItem('costflow_visit_count', count.toString());
    }

    calculateEngagement() {
        const timeOnPage = Date.now() - this.startTime;
        const scrollDepth = this.getScrollDepth();
        const interactions = this.events.filter(e => 
            e.event.includes('click') || 
            e.event.includes('input') || 
            e.event.includes('submit')
        ).length;
        
        // Simple engagement score (0-100)
        let score = 0;
        score += Math.min(timeOnPage / 1000 / 60 * 20, 40); // Max 40 points for time (2+ minutes)
        score += scrollDepth * 0.3; // Max 30 points for scroll depth
        score += Math.min(interactions * 10, 30); // Max 30 points for interactions
        
        return Math.round(score);
    }

    sendToAnalytics(event) {
        // Send to custom analytics endpoint
        fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event)
        }).catch(err => console.log('Analytics send failed:', err));
    }

    // Public methods for manual event tracking
    trackConversion(type, value) {
        this.trackEvent('conversion', {
            conversion_type: type,
            conversion_value: value,
            engagement_score: this.calculateEngagement()
        });
    }

    trackCalculatorResult(result) {
        this.trackEvent('calculator_result', {
            result_value: result,
            calculator_type: this.getCalculatorType(),
            time_to_result: Date.now() - this.startTime
        });
    }

    trackEmailCapture(email, source) {
        this.trackEvent('email_captured', {
            email: email,
            source: source,
            engagement_score: this.calculateEngagement()
        });
    }

    // A/B testing support
    getVariant(testName, variants) {
        const savedVariant = localStorage.getItem(`ab_test_${testName}`);
        if (savedVariant) {
            return savedVariant;
        }

        const variant = variants[Math.floor(Math.random() * variants.length)];
        localStorage.setItem(`ab_test_${testName}`, variant);
        
        this.trackEvent('ab_test_assigned', {
            test_name: testName,
            variant: variant
        });
        
        return variant;
    }

    // Performance monitoring
    trackPageLoadTime() {
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.trackEvent('page_load_time', {
                load_time_ms: loadTime,
                dom_content_loaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
            });
        });
    }
}

// Initialize analytics
const analytics = new CostFlowAnalytics();

// Make available globally for manual tracking
window.CostFlowAnalytics = analytics;

// Auto-track common events
document.addEventListener('DOMContentLoaded', () => {
    analytics.trackPageLoadTime();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CostFlowAnalytics;
}