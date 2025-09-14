/**
 * Performance Optimizer
 * Improves page load speed and runtime performance
 */

(function() {
    'use strict';
    
    const PerformanceOptimizer = {
        init: function() {
            this.setupLazyLoading();
            this.optimizeImages();
            this.deferNonCriticalCSS();
            this.setupResourceHints();
            this.enableRequestIdleCallback();
            this.setupIntersectionObserver();
            this.optimizeAnimations();
            this.cleanupTimers();
        },
        
        // Lazy load images
        setupLazyLoading: function() {
            if ('IntersectionObserver' in window) {
                const images = document.querySelectorAll('img[data-src]');
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            imageObserver.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px 0px',
                    threshold: 0.01
                });
                
                images.forEach(img => imageObserver.observe(img));
            }
        },
        
        // Optimize image loading
        optimizeImages: function() {
            // Add loading="lazy" to images below the fold
            const images = document.querySelectorAll('img:not([loading])');
            const viewportHeight = window.innerHeight;
            
            images.forEach(img => {
                const rect = img.getBoundingClientRect();
                if (rect.top > viewportHeight) {
                    img.loading = 'lazy';
                }
            });
        },
        
        // Defer non-critical CSS
        deferNonCriticalCSS: function() {
            const links = document.querySelectorAll('link[rel="stylesheet"][data-defer]');
            links.forEach(link => {
                link.media = 'print';
                link.onload = function() {
                    this.media = 'all';
                };
            });
        },
        
        // Setup resource hints
        setupResourceHints: function() {
            const head = document.head;
            
            // Preconnect to external domains
            const domains = [
                'https://www.googletagmanager.com',
                'https://www.google-analytics.com',
                'https://fonts.googleapis.com'
            ];
            
            domains.forEach(domain => {
                if (!document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) {
                    const link = document.createElement('link');
                    link.rel = 'preconnect';
                    link.href = domain;
                    link.crossOrigin = 'anonymous';
                    head.appendChild(link);
                }
            });
        },
        
        // Use requestIdleCallback for non-critical tasks
        enableRequestIdleCallback: function() {
            if (!('requestIdleCallback' in window)) {
                window.requestIdleCallback = function(callback) {
                    const start = Date.now();
                    return setTimeout(function() {
                        callback({
                            didTimeout: false,
                            timeRemaining: function() {
                                return Math.max(0, 50 - (Date.now() - start));
                            }
                        });
                    }, 1);
                };
            }
            
            if (!('cancelIdleCallback' in window)) {
                window.cancelIdleCallback = function(id) {
                    clearTimeout(id);
                };
            }
        },
        
        // Setup intersection observer for animations
        setupIntersectionObserver: function() {
            if ('IntersectionObserver' in window) {
                const animatedElements = document.querySelectorAll('[data-animate]');
                
                const animationObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('animate');
                            animationObserver.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1
                });
                
                animatedElements.forEach(el => animationObserver.observe(el));
            }
        },
        
        // Optimize animations
        optimizeAnimations: function() {
            // Reduce motion for users who prefer it
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                document.documentElement.style.setProperty('--animation-duration', '0.01ms');
                document.documentElement.classList.add('reduce-motion');
            }
            
            // Pause animations when tab is not visible
            document.addEventListener('visibilitychange', () => {
                const animations = document.getAnimations ? document.getAnimations() : [];
                if (document.hidden) {
                    animations.forEach(animation => animation.pause());
                } else {
                    animations.forEach(animation => animation.play());
                }
            });
        },
        
        // Cleanup timers and intervals
        cleanupTimers: function() {
            const originalSetTimeout = window.setTimeout;
            const originalSetInterval = window.setInterval;
            const timers = new Set();
            const intervals = new Set();
            
            window.setTimeout = function(...args) {
                const id = originalSetTimeout.apply(window, args);
                timers.add(id);
                return id;
            };
            
            window.setInterval = function(...args) {
                const id = originalSetInterval.apply(window, args);
                intervals.add(id);
                return id;
            };
            
            // Cleanup on page unload
            window.addEventListener('beforeunload', () => {
                timers.forEach(id => clearTimeout(id));
                intervals.forEach(id => clearInterval(id));
            });
        },
        
        // Monitor performance
        monitorPerformance: function() {
            if ('PerformanceObserver' in window) {
                // Monitor long tasks
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) {
                                if (window.ENV && window.ENV.isDevelopment) {
                                    console.warn('Long task detected:', entry);
                                }
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {
                    // Long task monitoring not supported
                }
            }
        },
        
        // Optimize scrolling
        optimizeScrolling: function() {
            let ticking = false;
            
            function updateScrolling() {
                // Your scroll-based updates here
                ticking = false;
            }
            
            document.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(updateScrolling);
                    ticking = true;
                }
            }, { passive: true });
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            PerformanceOptimizer.init();
        });
    } else {
        PerformanceOptimizer.init();
    }
    
    // Export for use in other modules
    window.PerformanceOptimizer = PerformanceOptimizer;
    
})();
