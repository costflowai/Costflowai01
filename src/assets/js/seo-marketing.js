// SEO & Marketing Powerhouse for CostFlowAI
class SEOMarketing {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupDynamicSEO();
        this.setupSocialSharing();
        this.setupLeadCapture();
        this.setupContentPersonalization();
        this.setupAnalytics();
    }
    
    // Dynamic SEO based on user behavior
    setupDynamicSEO() {
        const seoOptimizer = {
            updatePageMeta(calculatorType, estimate) {
                const templates = {
                    residential: {
                        title: `$${estimate?.toLocaleString()} Residential Construction Cost | CostFlowAI`,
                        description: `Get accurate residential construction estimates. Your project: $${estimate?.toLocaleString()}. Free AI-powered calculator with real-time pricing.`
                    },
                    commercial: {
                        title: `Commercial Construction Cost Calculator - $${estimate?.toLocaleString()} | CostFlowAI`,
                        description: `Calculate commercial construction costs instantly. AI-powered estimates starting at $${estimate?.toLocaleString()}. Trusted by 10,000+ contractors.`
                    }
                };
                
                if (estimate && templates[calculatorType]) {
                    document.title = templates[calculatorType].title;
                    document.querySelector('meta[name="description"]')?.setAttribute('content', templates[calculatorType].description);
                }
            },
            
            generateSchemaMarkup(calculatorType, result) {
                const schema = {
                    "@context": "https://schema.org",
                    "@type": "WebApplication",
                    "name": "CostFlowAI Calculator",
                    "applicationCategory": "BusinessApplication",
                    "offers": {
                        "@type": "Offer",
                        "price": "0",
                        "priceCurrency": "USD"
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": "4.8",
                        "ratingCount": "2500"
                    },
                    "potentialAction": {
                        "@type": "UseAction",
                        "target": window.location.href
                    }
                };
                
                // Add result-specific schema
                if (result) {
                    schema.result = {
                        "@type": "QuantitativeValue",
                        "value": result.total,
                        "unitText": "USD"
                    };
                }
                
                this.injectSchema(schema);
            },
            
            injectSchema(schema) {
                let scriptTag = document.querySelector('#dynamic-schema');
                if (!scriptTag) {
                    scriptTag = document.createElement('script');
                    scriptTag.id = 'dynamic-schema';
                    scriptTag.type = 'application/ld+json';
                    document.head.appendChild(scriptTag);
                }
                scriptTag.textContent = JSON.stringify(schema);
            }
        };
        
        window.SEOOptimizer = seoOptimizer;
    }
    
    // Social Sharing Optimization
    setupSocialSharing() {
        const socialSharing = {
            generateShareableImage(estimate, projectType) {
                // Create a canvas-based image with estimate details
                const canvas = document.createElement('canvas');
                canvas.width = 1200;
                canvas.height = 630;
                const ctx = canvas.getContext('2d');
                
                // Background gradient
                const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
                gradient.addColorStop(0, '#0066ff');
                gradient.addColorStop(1, '#0052cc');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1200, 630);
                
                // Text styling
                ctx.fillStyle = 'white';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('CostFlowAI Estimate', 600, 150);
                
                ctx.font = 'bold 72px Arial';
                ctx.fillText(`$${estimate?.toLocaleString()}`, 600, 300);
                
                ctx.font = '36px Arial';
                ctx.fillText(`${projectType.toUpperCase()} PROJECT`, 600, 400);
                
                ctx.font = '28px Arial';
                ctx.fillText('Get your free estimate at CostFlowAI.com', 600, 500);
                
                return canvas.toDataURL();
            },
            
            shareToSocial(platform, estimate, projectType) {
                const shareData = {
                    title: `My ${projectType} project estimate: $${estimate?.toLocaleString()}`,
                    text: `I just got an accurate construction estimate using CostFlowAI! Check it out:`,
                    url: window.location.href
                };
                
                const urls = {
                    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text + ' ' + shareData.title)}&url=${encodeURIComponent(shareData.url)}`,
                    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`,
                    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`
                };
                
                if (urls[platform]) {
                    const w = window.open(urls[platform], '_blank', 'noopener,noreferrer,width=600,height=400');
                    if (w) w.opener = null;
                }
                
                // Track sharing
                this.trackSocialShare(platform, estimate, projectType);
            },
            
            trackSocialShare(platform, estimate, projectType) {
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'share', {
                        method: platform,
                        content_type: 'calculator_result',
                        content_id: projectType,
                        value: estimate
                    });
                }
            }
        };
        
        window.SocialSharing = socialSharing;
    }
    
    // Advanced Lead Capture
    setupLeadCapture() {
        const leadCapture = {
            triggers: {
                timeOnSite: 45000, // 45 seconds
                calculationsUsed: 3,
                highValueEstimate: 100000
            },
            
            init() {
                this.startTimeTracking();
                this.trackCalculations();
                this.createSmartPopups();
            },
            
            startTimeTracking() {
                setTimeout(() => {
                    if (!localStorage.getItem('email_captured')) {
                        this.showTimeBasedPopup();
                    }
                }, this.triggers.timeOnSite);
            },
            
            trackCalculations() {
                let count = parseInt(localStorage.getItem('calc_count') || '0');
                count++;
                localStorage.setItem('calc_count', count.toString());
                
                if (count >= this.triggers.calculationsUsed && !localStorage.getItem('email_captured')) {
                    this.showEngagementPopup();
                }
            },
            
            showTimeBasedPopup() {
                this.createPopup({
                    title: '🎯 Construction Pro?',
                    message: 'Get weekly cost insights & exclusive contractor discounts',
                    cta: 'Get Free Insights',
                    type: 'time_based'
                });
            },
            
            showEngagementPopup() {
                this.createPopup({
                    title: '📊 Love the Calculators?',
                    message: 'Join 5,000+ contractors getting advanced estimates & market alerts',
                    cta: 'Unlock Pro Features',
                    type: 'engagement'
                });
            },
            
            showHighValuePopup(estimate) {
                if (estimate > this.triggers.highValueEstimate) {
                    this.createPopup({
                        title: '💼 Big Project Alert!',
                        message: `For $${estimate.toLocaleString()}+ projects, get personalized consultant support`,
                        cta: 'Talk to Expert',
                        type: 'high_value'
                    });
                }
            },
            
            createPopup(config) {
                const popup = document.createElement('div');
                popup.className = 'lead-popup';
                popup.innerHTML = `
                    <div class="popup-overlay">
                        <div class="popup-content">
                            <button class="popup-close">&times;</button>
                            <h3>${config.title}</h3>
                            <p>${config.message}</p>
                            <form class="popup-form">
                                <input type="email" placeholder="Enter your email" required>
                                <button type="submit">${config.cta}</button>
                            </form>
                            <small>No spam. Unsubscribe anytime.</small>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(popup);
                this.attachPopupEvents(popup, config.type);
            },
            
            attachPopupEvents(popup, type) {
                const form = popup.querySelector('.popup-form');
                const close = popup.querySelector('.popup-close');
                
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const email = form.querySelector('input[type="email"]').value;
                    this.captureEmail(email, type);
                    popup.remove();
                });
                
                close.addEventListener('click', () => popup.remove());
                popup.addEventListener('click', (e) => {
                    if (e.target.className === 'popup-overlay') popup.remove();
                });
            },
            
            captureEmail(email, source) {
                localStorage.setItem('email_captured', 'true');
                localStorage.setItem('user_email', email);
                
                // Track conversion
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'conversion', {
                        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
                        value: 1.0,
                        currency: 'USD',
                        transaction_id: Date.now().toString()
                    });
                }
                
                // Send to your email service
                this.sendToEmailService(email, source);
                
                // Show thank you
                this.showThankYou();
            },
            
            sendToEmailService(email, source) {
                // Integration with email services (Mailchimp, ConvertKit, etc.)
                fetch('/api/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, source, timestamp: new Date().toISOString() })
                }).catch(err => console.log('Email service integration needed'));
            },
            
            showThankYou() {
                const notification = document.createElement('div');
                notification.className = 'thank-you-notification';
                notification.innerHTML = `
                    <div class="notification-content">
                        ✅ Thanks! Check your email for exclusive contractor resources.
                    </div>
                `;
                document.body.appendChild(notification);
                
                setTimeout(() => notification.remove(), 5000);
            }
        };
        
        leadCapture.init();
        window.LeadCapture = leadCapture;
    }
    
    // Content Personalization
    setupContentPersonalization() {
        const personalization = {
            getUserProfile() {
                const profile = {
                    calculationsUsed: parseInt(localStorage.getItem('calc_count') || '0'),
                    preferredType: localStorage.getItem('preferred_calc_type') || 'residential',
                    avgProjectSize: parseInt(localStorage.getItem('avg_project_size') || '0'),
                    location: localStorage.getItem('user_location') || 'unknown',
                    returning: localStorage.getItem('returning_user') === 'true'
                };
                
                return profile;
            },
            
            personalizeContent() {
                const profile = this.getUserProfile();
                
                // Show relevant calculators first
                this.reorderCalculators(profile.preferredType);
                
                // Customize hero message
                this.personalizeHero(profile);
                
                // Show relevant blog posts
                this.personalizeBlog(profile);
            },
            
            reorderCalculators(preferred) {
                const grid = document.querySelector('.calc-grid');
                if (!grid) return;
                
                const cards = Array.from(grid.children);
                const preferredCard = cards.find(card => 
                    card.textContent.toLowerCase().includes(preferred)
                );
                
                if (preferredCard) {
                    grid.insertBefore(preferredCard, grid.firstChild);
                }
            },
            
            personalizeHero(profile) {
                const hero = document.querySelector('.hero-subtitle');
                if (!hero || !profile.returning) return;
                
                const messages = {
                    residential: 'Welcome back! Ready for another home project estimate?',
                    commercial: 'Good to see you again! Let\'s estimate your next commercial project.',
                    concrete: 'Back for more concrete calculations? We\'ve got you covered.'
                };
                
                hero.textContent = messages[profile.preferredType] || hero.textContent;
            },
            
            personalizeBlog(profile) {
                const blogSection = document.querySelector('.blog-posts');
                if (!blogSection) return;
                
                // Show relevant blog posts based on user behavior
                const relevantPosts = this.getRelevantPosts(profile.preferredType);
                this.displayBlogPosts(relevantPosts, blogSection);
            },
            
            getRelevantPosts(type) {
                const posts = {
                    residential: [
                        { title: '2025 Home Building Costs by Region', url: '/blog/home-costs-2025' },
                        { title: 'Kitchen Renovation Cost Guide', url: '/blog/kitchen-costs' }
                    ],
                    commercial: [
                        { title: 'Commercial Construction Trends', url: '/blog/commercial-trends' },
                        { title: 'Office Build-out Cost Analysis', url: '/blog/office-costs' }
                    ]
                };
                
                return posts[type] || posts.residential;
            }
        };
        
        personalization.personalizeContent();
        window.Personalization = personalization;
    }
    
    // Advanced Analytics
    setupAnalytics() {
        const analytics = {
            trackAdvancedEvents() {
                // Heat mapping simulation
                this.trackScrollDepth();
                this.trackClickHeatmap();
                this.trackFormInteractions();
                this.trackCalculatorUsage();
            },
            
            trackScrollDepth() {
                let maxScroll = 0;
                window.addEventListener('scroll', () => {
                    const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
                    if (scrollPercent > maxScroll) {
                        maxScroll = scrollPercent;
                        
                        if ([25, 50, 75, 100].includes(maxScroll)) {
                            this.sendEvent('scroll_depth', { depth: maxScroll });
                        }
                    }
                }, { passive: true });
            },
            
            trackClickHeatmap() {
                document.addEventListener('click', (e) => {
                    const element = e.target;
                    const data = {
                        tag: element.tagName,
                        class: element.className,
                        id: element.id,
                        text: element.textContent?.substring(0, 50),
                        x: e.pageX,
                        y: e.pageY
                    };
                    
                    this.sendEvent('click_heatmap', data);
                });
            },
            
            trackFormInteractions() {
                document.querySelectorAll('input, select').forEach(input => {
                    input.addEventListener('focus', () => {
                        this.sendEvent('form_field_focus', { field: input.name || input.id });
                    });
                    
                    input.addEventListener('blur', () => {
                        if (input.value) {
                            this.sendEvent('form_field_complete', { field: input.name || input.id });
                        }
                    });
                });
            },
            
            trackCalculatorUsage() {
                const originalSubmit = HTMLFormElement.prototype.submit;
                HTMLFormElement.prototype.submit = function() {
                    if (this.classList.contains('calculator-form')) {
                        analytics.sendEvent('calculator_submit', { 
                            type: this.id,
                            timestamp: Date.now()
                        });
                    }
                    originalSubmit.call(this);
                };
            },
            
            sendEvent(eventName, data) {
                if (typeof gtag !== 'undefined') {
                    gtag('event', eventName, data);
                }
                
                // Store locally for analysis
                const events = JSON.parse(localStorage.getItem('user_events') || '[]');
                events.push({ event: eventName, data, timestamp: Date.now() });
                localStorage.setItem('user_events', JSON.stringify(events.slice(-100))); // Keep last 100
            }
        };
        
        analytics.trackAdvancedEvents();
        window.Analytics = analytics;
    }
}

// Add CSS for popups and notifications
const marketingCSS = `
.lead-popup {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
}

.popup-overlay {
    background: rgba(0,0,0,0.8);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
}

.popup-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    max-width: 400px;
    text-align: center;
    position: relative;
    animation: slideIn 0.3s ease;
}

.popup-close {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.popup-form {
    margin: 1rem 0;
}

.popup-form input {
    width: 100%;
    padding: 12px;
    margin: 0.5rem 0;
    border: 2px solid #ddd;
    border-radius: 6px;
}

.popup-form button {
    width: 100%;
    padding: 12px;
    background: #0066ff;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
}

.thank-you-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
}

.notification-content {
    background: #4CAF50;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideInUp 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

@keyframes slideInUp {
    from { transform: translateY(100px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = marketingCSS;
document.head.appendChild(styleSheet);

// Initialize SEO & Marketing
document.addEventListener('DOMContentLoaded', () => {
    window.seoMarketing = new SEOMarketing();
    console.log('🚀 SEO & Marketing features loaded');
});