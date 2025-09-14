// Enhanced Analytics & Tracking for CostFlowAI
// This file provides comprehensive tracking for Google Analytics 4, performance monitoring, and user engagement

(function() {
    'use strict';

    // Enhanced GA4 Event Tracking
    window.trackEvent = function(eventName, parameters) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
    };

    // Track page performance metrics
    function trackWebVitals() {
        // Track Core Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint (LCP)
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    trackEvent('web_vitals', {
                        metric_name: 'LCP',
                        value: Math.round(lastEntry.renderTime || lastEntry.loadTime),
                        metric_id: lastEntry.id,
                        page_url: window.location.href
                    });
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {}

            // First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        trackEvent('web_vitals', {
                            metric_name: 'FID',
                            value: Math.round(entry.processingStart - entry.startTime),
                            page_url: window.location.href
                        });
                    });
                });
                fidObserver.observe({ type: 'first-input', buffered: true });
            } catch (e) {}

            // Cumulative Layout Shift (CLS)
            try {
                let clsValue = 0;
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
                
                // Report CLS when page is about to unload
                addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') {
                        trackEvent('web_vitals', {
                            metric_name: 'CLS',
                            value: Math.round(clsValue * 1000) / 1000,
                            page_url: window.location.href
                        });
                    }
                });
            } catch (e) {}
        }

        // Track page load time
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perfData = performance.timing;
                const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
                const connectTime = perfData.responseEnd - perfData.requestStart;
                const renderTime = perfData.domComplete - perfData.domLoading;

                trackEvent('page_performance', {
                    page_load_time: pageLoadTime,
                    connect_time: connectTime,
                    render_time: renderTime,
                    page_url: window.location.href
                });
            }, 0);
        });
    }

    // Enhanced scroll tracking
    function trackScrollDepth() {
        let maxScroll = 0;
        const thresholds = [25, 50, 75, 90, 100];
        const threholdsReached = new Set();

        function calculateScrollPercentage() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const trackLength = documentHeight - windowHeight;
            const scrollPercentage = Math.round((scrollTop / trackLength) * 100);
            return Math.min(scrollPercentage, 100);
        }

        function checkScrollThresholds() {
            const scrollPercentage = calculateScrollPercentage();
            
            if (scrollPercentage > maxScroll) {
                maxScroll = scrollPercentage;
                
                thresholds.forEach(threshold => {
                    if (scrollPercentage >= threshold && !threholdsReached.has(threshold)) {
                        threholdsReached.add(threshold);
                        trackEvent('scroll_depth', {
                            percentage: threshold,
                            page_url: window.location.href
                        });
                    }
                });
            }
        }

        let scrollTimer;
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(checkScrollThresholds, 100);
        }, { passive: true });

        // Track max scroll on page unload
        window.addEventListener('beforeunload', function() {
            if (maxScroll > 0) {
                trackEvent('max_scroll_depth', {
                    percentage: maxScroll,
                    page_url: window.location.href
                });
            }
        });
    }

    // Track engagement time
    function trackEngagementTime() {
        let startTime = Date.now();
        let totalTime = 0;
        let isEngaged = true;

        // Track when user leaves/returns to page
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                if (isEngaged) {
                    totalTime += Date.now() - startTime;
                    isEngaged = false;
                }
            } else {
                startTime = Date.now();
                isEngaged = true;
            }
        });

        // Send engagement time before page unload
        window.addEventListener('beforeunload', function() {
            if (isEngaged) {
                totalTime += Date.now() - startTime;
            }
            if (totalTime > 0) {
                trackEvent('engagement_time', {
                    time_seconds: Math.round(totalTime / 1000),
                    page_url: window.location.href
                });
            }
        });
    }

    // Track calculator usage
    function trackCalculatorUsage() {
        // Track form submissions
        document.addEventListener('submit', function(e) {
            if (e.target.classList.contains('calculator-form')) {
                const formName = e.target.getAttribute('data-calculator-name') || 'unknown';
                trackEvent('calculator_used', {
                    calculator_name: formName,
                    page_url: window.location.href
                });
            }
        });

        // Track calculator interactions
        document.addEventListener('change', function(e) {
            if (e.target.closest('.calculator-form')) {
                const formName = e.target.closest('.calculator-form').getAttribute('data-calculator-name') || 'unknown';
                trackEvent('calculator_interaction', {
                    calculator_name: formName,
                    field_name: e.target.name || e.target.id,
                    page_url: window.location.href
                });
            }
        });
    }

    // Track outbound links
    function trackOutboundLinks() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.hostname !== window.location.hostname) {
                trackEvent('outbound_link', {
                    url: link.href,
                    from_page: window.location.href
                });
            }
        });
    }

    // Track file downloads
    function trackDownloads() {
        const downloadExtensions = ['pdf', 'xlsx', 'docx', 'csv', 'zip'];
        
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href) {
                const url = new URL(link.href, window.location.href);
                const extension = url.pathname.split('.').pop().toLowerCase();
                
                if (downloadExtensions.includes(extension)) {
                    trackEvent('file_download', {
                        file_url: link.href,
                        file_type: extension,
                        from_page: window.location.href
                    });
                }
            }
        });
    }

    // Track 404 errors
    function track404Errors() {
        if (document.title.toLowerCase().includes('404') || 
            document.body.textContent.toLowerCase().includes('page not found')) {
            trackEvent('404_error', {
                page_url: window.location.href,
                referrer: document.referrer
            });
        }
    }

    // Enhanced user properties
    function setUserProperties() {
        // Device type
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isTablet = /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent);
        
        if (typeof gtag !== 'undefined') {
            gtag('set', 'user_properties', {
                device_type: isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop'),
                screen_resolution: window.screen.width + 'x' + window.screen.height,
                viewport_size: window.innerWidth + 'x' + window.innerHeight,
                connection_type: navigator.connection ? navigator.connection.effectiveType : 'unknown'
            });
        }
    }

    // Initialize all tracking
    function initializeTracking() {
        trackWebVitals();
        trackScrollDepth();
        trackEngagementTime();
        trackCalculatorUsage();
        trackOutboundLinks();
        trackDownloads();
        track404Errors();
        setUserProperties();

        // Track initial page view with enhanced data
        trackEvent('enhanced_page_view', {
            page_title: document.title,
            page_url: window.location.href,
            page_path: window.location.pathname,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
    }

    // Wait for GA4 to load, then initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTracking);
    } else {
        initializeTracking();
    }

    // Expose tracking function globally for custom events
    window.CostFlowAI = window.CostFlowAI || {};
    window.CostFlowAI.track = trackEvent;

})();