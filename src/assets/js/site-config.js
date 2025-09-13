/**
 * CostFlowAI Site Configuration
 * Single source of truth for all branding, offers, and metrics
 */

window.SiteConfig = {
    // Company branding
    company: {
        name: 'CostFlowAI',
        tagline: 'AI-Powered Construction Cost Estimation',
        description: 'Get instant, accurate construction cost estimates with regional pricing and professional exports.',
        website: 'https://costflowai.com',
        email: 'hello@costflowai.com',
        support: 'support@costflowai.com',
        year: new Date().getFullYear()
    },

    // Main value proposition - SINGLE SOURCE OF TRUTH
    offer: {
        main: {
            title: 'All Construction Calculators - Completely Free',
            subtitle: 'Unlimited calculations with professional features included',
            features: [
                'Unlimited calculator access',
                'All advanced features included', 
                'Regional cost adjustments',
                'Professional PDF/CSV exports',
                'Real-time pricing data',
                'No usage limits or restrictions'
            ]
        },
        aiPremium: {
            title: 'AI Photo Estimator & API Access',
            subtitle: 'Advanced AI features for power users',
            features: [
                'AI Photo Analysis & Estimates',
                'Advanced Risk Assessment Pro',
                'API Access & Integrations',
                'Enterprise Support'
            ],
            status: 'coming_soon',
            note: 'Currently in development - all features free during beta'
        },
        enterprise: {
            title: 'Enterprise Solutions Available', 
            subtitle: 'Custom integrations and team features',
            contact: 'enterprise@costflowai.com'
        }
    },

    // Verified metrics and claims
    metrics: {
        accuracy: {
            value: '95%',
            range: '±5%',
            verified: true,
            description: '95% accuracy within ±5% of final project costs',
            methodology: 'Validated against 10,000+ completed projects using ENR, BLS, and RSMeans data',
            lastUpdated: '2025-01-15'
        },
        calculations: {
            value: 'Typical ±15%',
            range: 'ROM accuracy',
            verified: false,
            description: 'Rough order of magnitude estimates - actual costs may vary',
            methodology: 'Based on industry standard ROM practices',
            beta: true
        },
        averageTime: {
            value: '15 seconds',
            verified: true,
            description: 'Average calculation time',
            lastUpdated: '2025-09-01'
        },
        uptime: {
            value: '99.9%',
            verified: false,
            description: 'System uptime (estimated)',
            beta: true
        },
        users: {
            value: 'Growing daily',
            verified: false,
            description: 'Active user base (not tracked)',
            beta: true
        }
    },

    // Navigation structure
    navigation: {
        primary: [
            { name: 'Home', path: '/', exact: true },
            { name: 'Calculators', path: '/calculators' },
            { name: 'Blog', path: '/blog' },
            { name: 'Contact', path: '#contact' },
            { name: '💬 Feedback', path: '#contact' }
        ],
        footer: {
            calculators: [
                { name: 'Residential ROM', path: '/calculators/residential-rom' },
                { name: 'Commercial TI', path: '/calculators/commercial-ti' },
                { name: 'Concrete Calculator', path: '/calculators/concrete' },
                { name: 'ROI Maximizer', path: '/calculators/roi-maximizer' },
                { name: 'Risk Assessment', path: '/calculators/risk-assessment-pro' },
                { name: 'View All Calculators →', path: '/calculators' }
            ],
            resources: [
                { name: 'Construction Blog', path: '/blog' },
                { name: 'About CostFlowAI', path: '/about' },
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms of Service', path: '/terms' }
            ],
            support: [
                { name: '📧 Contact Support', path: 'mailto:support@costflowai.com' },
                { name: '💬 Send Feedback', path: 'mailto:feedback@costflowai.com' },
                { name: 'Help & FAQ', path: '/' }
            ]
        }
    },

    // API configuration
    api: {
        status: 'coming_soon', // 'live', 'beta', 'coming_soon'
        baseUrl: 'https://api.costflowai.com',
        version: 'v1',
        rateLimit: '1000 requests/hour',
        authRequired: true,
        features: {
            calculations: { status: 'coming_soon' },
            exports: { status: 'coming_soon' },
            webhooks: { status: 'planned' }
        }
    },

    // Features configuration
    features: {
        aiEstimator: {
            status: 'beta',
            trustElements: true,
            dataSources: ['Computer Vision AI', 'Historical Project Database', 'Real-time Market Data'],
            lastUpdated: '2025-08-15',
            accuracy: '95% confidence on standard projects'
        },
        intelligenceDashboard: {
            status: 'beta',
            trustElements: true,
            dataSources: ['ENR Construction Cost Index', 'Bureau of Labor Statistics', 'RSMeans Database'],
            updateFrequency: 'Weekly',
            lastUpdated: '2025-09-01'
        },
        calculators: {
            exportFormats: ['PDF', 'CSV', 'JSON'],
            locationSupport: true,
            statesCovered: 50,
            yearlyUpdates: true
        }
    },

    // Disclaimers and legal
    disclaimers: {
        general: 'Estimates are for planning purposes only. Actual costs may vary based on local conditions, materials, labor rates, and project complexity.',
        accuracy: 'Accuracy percentages are based on comparison with completed projects in our database. Individual results may vary.',
        beta: 'This feature is in beta. Data and functionality may change as we continue to improve the service.',
        api: 'API is under development. Features and endpoints may change before general availability.'
    },

    // Data sources and methodology
    methodology: {
        dataSources: [
            {
                name: 'ENR Construction Cost Index',
                description: 'Engineering News-Record cost data for materials and labor',
                updateFrequency: 'Monthly',
                coverage: 'US National & Metro Areas'
            },
            {
                name: 'Bureau of Labor Statistics',
                description: 'Official US government labor cost and productivity data',
                updateFrequency: 'Monthly',
                coverage: 'All US States'
            },
            {
                name: 'RSMeans Database',
                description: 'Industry-standard construction cost database',
                updateFrequency: 'Quarterly',
                coverage: 'North America'
            },
            {
                name: 'Historical Project Data',
                description: 'Our database of completed construction projects',
                updateFrequency: 'Real-time',
                coverage: '10,000+ projects across US'
            }
        ],
        validation: {
            method: 'Cross-validation against completed projects',
            sampleSize: '10,000+ projects',
            timeframe: '2020-2025',
            accuracy: '95% within ±5% of final costs'
        }
    },

    // Content helpers
    helpers: {
        formatMetric(metricKey) {
            const metric = this.metrics[metricKey];
            if (!metric) return '';
            
            let display = metric.value;
            if (metric.range) display += ` ${metric.range}`;
            if (metric.beta && !metric.verified) display += ' (est.)';
            
            return display;
        },

        getMetricWithTooltip(metricKey) {
            const metric = this.metrics[metricKey];
            if (!metric) return { value: '', tooltip: '' };
            
            return {
                value: this.formatMetric(metricKey),
                tooltip: metric.description,
                verified: metric.verified,
                beta: metric.beta
            };
        },

        isCurrentPath(path, exact = false) {
            const currentPath = window.location.pathname;
            if (exact) {
                return currentPath === path;
            }
            return path !== '/' ? currentPath.startsWith(path) : currentPath === path;
        },

        getActiveClass(path, exact = false) {
            return this.isCurrentPath(path, exact) ? 'active' : '';
        }
    }
};

// Make configuration available globally
window.CONFIG = window.SiteConfig;

// Initialize configuration display
document.addEventListener('DOMContentLoaded', () => {
    // Update any elements with data-config attributes
    document.querySelectorAll('[data-config]').forEach(element => {
        const configPath = element.getAttribute('data-config');
        let value = configPath.split('.').reduce((obj, key) => obj?.[key], window.CONFIG);
        
        // Handle metric formatting
        if (configPath.includes('metrics.')) {
            const metricKey = configPath.split('.').pop();
            const metricData = window.CONFIG.helpers.getMetricWithTooltip(metricKey);
            value = metricData.value;
            
            if (element.hasAttribute('data-config-metric-tooltip')) {
                element.title = metricData.tooltip;
                if (metricData.verified) {
                    element.style.color = '#059669';
                    element.style.fontWeight = 'bold';
                } else if (metricData.beta) {
                    element.style.opacity = '0.8';
                }
            }
        }
        
        if (value !== undefined) {
            // Handle concatenated values (data-config-append and data-config-2)
            let finalValue = value;
            const appendText = element.getAttribute('data-config-append');
            const secondConfig = element.getAttribute('data-config-2');
            
            if (appendText && secondConfig) {
                const secondValue = secondConfig.split('.').reduce((obj, key) => obj?.[key], window.CONFIG);
                finalValue = value + appendText + secondValue;
            } else if (appendText) {
                finalValue = value + appendText;
            }
            
            element.textContent = finalValue;
        }
    });

    // Update metric displays
    document.querySelectorAll('[data-config-metric]').forEach(element => {
        const metricKey = element.getAttribute('data-config-metric');
        const metricData = window.CONFIG.helpers.getMetricWithTooltip(metricKey);
        element.textContent = metricData.value;
        
        // Add verification indicators
        if (metricData.verified) {
            element.style.color = '#059669';
            element.style.fontWeight = 'bold';
            element.title = metricData.tooltip + ' (Verified)';
        } else if (metricData.beta) {
            element.style.opacity = '0.8';
            element.title = metricData.tooltip + ' (Estimated)';
        }
    });

    // Update year in copyright notices
    document.querySelectorAll('.current-year').forEach(element => {
        element.textContent = new Date().getFullYear();
    });
});