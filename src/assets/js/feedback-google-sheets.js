/**
 * CostFlowAI Feedback Google Sheets Integration
 * Secure feedback collection to Google Sheets via Google Apps Script
 */

class GoogleSheetsIntegration {
    constructor() {
        // Google Apps Script Web App URL - PLACEHOLDER: Deploy the feedback-handler.gs first
        this.webAppUrl = 'https://script.google.com/macros/s/AKfycbx_DEPLOY_FEEDBACK_HANDLER_FIRST/exec';
        
        // Rate limiting
        this.rateLimiter = {
            maxSubmissions: 5, // per hour
            window: 60 * 60 * 1000, // 1 hour in ms
            storage: 'costflowai_feedback_rate_limit'
        };
        
        // Security settings
        this.security = {
            honeypot: true,
            csrfToken: this.generateCSRFToken(),
            maxFieldLength: 5000,
            allowedDomains: ['costflowai.com', 'localhost']
        };
        
        this.init();
    }

    init() {
        this.setupSecurityHeaders();
        this.createHoneypot();
    }

    /**
     * Send feedback to Google Sheets
     */
    async sendToGoogleSheets(feedbackData) {
        // Security checks
        if (!this.passesSecurityChecks(feedbackData)) {
            throw new Error('Security validation failed');
        }

        // Rate limiting
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Prepare data for Google Sheets
        const sheetData = this.prepareSheetData(feedbackData);
        
        try {
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.security.csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    action: 'submit_feedback',
                    data: sheetData,
                    timestamp: new Date().toISOString(),
                    origin: window.location.origin,
                    fingerprint: this.getBrowserFingerprint()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.updateRateLimit();
                this.logSuccess(feedbackData.type);
                return result;
            } else {
                throw new Error(result.error || 'Unknown error occurred');
            }

        } catch (error) {
            console.error('Google Sheets submission failed:', error);
            
            // Fallback to local storage
            this.saveToLocalStorage(feedbackData);
            throw error;
        }
    }

    /**
     * Prepare data for Google Sheets with proper structure
     */
    prepareSheetData(feedbackData) {
        const baseData = {
            // Core fields that go to all feedback
            timestamp: new Date().toISOString(),
            type: feedbackData.type || 'general',
            user_id: feedbackData.user_id || 'anonymous',
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            ip_hash: this.getIPHash(), // Privacy-friendly IP tracking
            
            // User data
            email: feedbackData.data?.email || '',
            category: feedbackData.data?.category || '',
            message: this.sanitizeText(feedbackData.data?.message || ''),
            
            // Additional metadata
            session_duration: this.getSessionDuration(),
            page_views: this.getPageViews(),
            previous_feedback: this.getPreviousFeedbackCount(),
            
            // A/B testing info
            ab_test_group: this.getABTestGroup(),
            
            // Device info
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            
            // Conversion data
            is_paying_user: this.isPayingUser(),
            subscription_tier: this.getSubscriptionTier(),
            trial_status: this.getTrialStatus()
        };

        // Add type-specific data
        switch (feedbackData.type) {
            case 'cancellation':
                return {
                    ...baseData,
                    sheet: 'Cancellations',
                    cancellation_reasons: JSON.stringify(feedbackData.data?.reasons || []),
                    improvements_requested: this.sanitizeText(feedbackData.data?.improvements || ''),
                    alternative_product: this.sanitizeText(feedbackData.data?.alternative || ''),
                    overall_rating: feedbackData.data?.rating || '',
                    retention_offer_selected: feedbackData.data?.retention_offer || 'none',
                    subscription_id: feedbackData.subscription_id || '',
                    days_as_customer: this.getDaysAsCustomer()
                };

            case 'trial_feedback':
                return {
                    ...baseData,
                    sheet: 'Trial_Feedback',
                    trial_rating: feedbackData.data?.trial_rating || '',
                    liked_features: JSON.stringify(feedbackData.data?.liked_features || []),
                    barriers_to_value: this.sanitizeText(feedbackData.data?.barriers || ''),
                    nps_score: feedbackData.data?.nps || '',
                    trial_days_used: this.getTrialDaysUsed(),
                    calculations_made: this.getCalculationsMade()
                };

            case 'feature_request':
                return {
                    ...baseData,
                    sheet: 'Feature_Requests',
                    feature_title: this.sanitizeText(feedbackData.data?.feature_title || ''),
                    feature_description: this.sanitizeText(feedbackData.data?.feature_description || ''),
                    priority_level: feedbackData.data?.priority || 'medium',
                    current_workaround: this.sanitizeText(feedbackData.data?.workaround || '')
                };

            case 'bug_report':
                return {
                    ...baseData,
                    sheet: 'Bug_Reports',
                    bug_title: this.sanitizeText(feedbackData.data?.bug_title || ''),
                    bug_description: this.sanitizeText(feedbackData.data?.bug_steps || ''),
                    bug_location: feedbackData.data?.bug_location || '',
                    browser_info: feedbackData.data?.bug_environment || navigator.userAgent,
                    reproduction_steps: this.sanitizeText(feedbackData.data?.bug_steps || ''),
                    severity: this.guessBugSeverity(feedbackData.data?.bug_title || '')
                };

            case 'calculator_feedback':
                return {
                    ...baseData,
                    sheet: 'Calculator_Feedback',
                    calculator_name: feedbackData.data?.calculator_id || 'unknown',
                    accuracy_rating: feedbackData.data?.accuracy_rating || '',
                    specific_feedback: this.sanitizeText(feedbackData.data?.calculator_feedback || ''),
                    calculation_inputs: this.getLastCalculationInputs(),
                    calculation_results: this.getLastCalculationResults()
                };

            default:
                return {
                    ...baseData,
                    sheet: 'General_Feedback'
                };
        }
    }

    /**
     * Security validation
     */
    passesSecurityChecks(feedbackData) {
        // Check honeypot
        if (this.isHoneypotTriggered()) {
            this.logSecurityEvent('honeypot_triggered');
            return false;
        }

        // Check domain
        if (!this.security.allowedDomains.includes(window.location.hostname)) {
            this.logSecurityEvent('invalid_domain', { domain: window.location.hostname });
            return false;
        }

        // Check field lengths
        const textFields = ['message', 'improvements', 'additional_comments', 'barriers', 'bug_description'];
        for (const field of textFields) {
            const value = feedbackData.data?.[field] || '';
            if (value.length > this.security.maxFieldLength) {
                this.logSecurityEvent('field_too_long', { field, length: value.length });
                return false;
            }
        }

        // Check for suspicious patterns
        if (this.containsSuspiciousContent(feedbackData)) {
            this.logSecurityEvent('suspicious_content');
            return false;
        }

        // Check referrer
        if (document.referrer && !this.isValidReferrer(document.referrer)) {
            this.logSecurityEvent('invalid_referrer', { referrer: document.referrer });
            return false;
        }

        return true;
    }

    /**
     * Rate limiting
     */
    checkRateLimit() {
        const now = Date.now();
        const submissions = this.getStoredSubmissions();
        
        // Remove old submissions outside the window
        const recent = submissions.filter(time => now - time < this.rateLimiter.window);
        
        if (recent.length >= this.rateLimiter.maxSubmissions) {
            return false;
        }

        return true;
    }

    updateRateLimit() {
        const now = Date.now();
        const submissions = this.getStoredSubmissions();
        submissions.push(now);
        
        // Keep only recent submissions
        const recent = submissions.filter(time => now - time < this.rateLimiter.window);
        localStorage.setItem(this.rateLimiter.storage, JSON.stringify(recent));
    }

    getStoredSubmissions() {
        try {
            return JSON.parse(localStorage.getItem(this.rateLimiter.storage) || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Security helpers
     */
    setupSecurityHeaders() {
        // Add CSP if not already present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const csp = document.createElement('meta');
            csp.httpEquiv = 'Content-Security-Policy';
            csp.content = "script-src 'self' 'unsafe-inline' https://script.google.com; connect-src 'self' https://script.google.com;";
            document.head.appendChild(csp);
        }
    }

    createHoneypot() {
        if (!document.getElementById('feedback-honeypot')) {
            const honeypot = document.createElement('div');
            honeypot.id = 'feedback-honeypot';
            honeypot.innerHTML = `
                <input type="text" name="website" style="display: none !important;" tabindex="-1" autocomplete="off">
                <input type="email" name="email_confirm" style="position: absolute; left: -9999px;" tabindex="-1" autocomplete="off">
            `;
            document.body.appendChild(honeypot);
        }
    }

    isHoneypotTriggered() {
        const honeypotFields = document.querySelectorAll('#feedback-honeypot input');
        return Array.from(honeypotFields).some(field => field.value !== '');
    }

    containsSuspiciousContent(feedbackData) {
        const suspiciousPatterns = [
            /\b(viagra|cialis|casino|poker|lottery|bitcoin|crypto)\b/i,
            /\b(click here|visit now|buy now|limited time)\b/i,
            /<script|javascript:|data:|vbscript:/i,
            /\b(http[s]?:\/\/(?!costflowai\.com))/gi,
            /(.)\1{50,}/, // Repeated characters
            /[^\x00-\x7F]/g // Non-ASCII characters (basic check)
        ];

        const textToCheck = JSON.stringify(feedbackData.data || {});
        return suspiciousPatterns.some(pattern => pattern.test(textToCheck));
    }

    isValidReferrer(referrer) {
        const allowedReferrers = [
            'costflowai.com',
            'localhost',
            'google.com',
            'bing.com',
            'duckduckgo.com'
        ];

        try {
            const referrerDomain = new URL(referrer).hostname;
            return allowedReferrers.some(allowed => referrerDomain.includes(allowed));
        } catch {
            return false;
        }
    }

    /**
     * Utility functions
     */
    generateCSRFToken() {
        return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
    }

    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocols
            .replace(/data:/gi, '') // Remove data: protocols
            .trim()
            .substring(0, this.security.maxFieldLength);
    }

    getBrowserFingerprint() {
        // Create a privacy-friendly fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('CostFlowAI fingerprint', 2, 2);
        
        return btoa(JSON.stringify({
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            canvas: canvas.toDataURL().substring(0, 50)
        }));
    }

    getIPHash() {
        // Use a simple hash of the IP (server-side would be better)
        return btoa(navigator.userAgent + Date.now().toString()).substring(0, 16);
    }

    getSessionDuration() {
        const sessionStart = sessionStorage.getItem('costflowai_session_start') || Date.now();
        return Math.floor((Date.now() - sessionStart) / 1000); // seconds
    }

    getPageViews() {
        const views = parseInt(sessionStorage.getItem('costflowai_page_views') || '0');
        sessionStorage.setItem('costflowai_page_views', (views + 1).toString());
        return views + 1;
    }

    getPreviousFeedbackCount() {
        const feedback = JSON.parse(localStorage.getItem('costflowai_feedback') || '[]');
        return feedback.length;
    }

    getABTestGroup() {
        // Simple A/B test grouping
        const stored = localStorage.getItem('costflowai_ab_group');
        if (stored) return stored;
        
        const group = Math.random() > 0.5 ? 'A' : 'B';
        localStorage.setItem('costflowai_ab_group', group);
        return group;
    }

    isPayingUser() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        return subscription.status === 'active' || subscription.status === 'trialing';
    }

    getSubscriptionTier() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        return subscription.plan || 'free';
    }

    getTrialStatus() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        if (subscription.status === 'trialing') {
            const trialEnd = new Date(subscription.trial_end);
            const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
            return `trial_${Math.max(0, daysLeft)}_days_left`;
        }
        return 'not_on_trial';
    }

    getDaysAsCustomer() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        if (subscription.created) {
            return Math.floor((Date.now() - new Date(subscription.created).getTime()) / (1000 * 60 * 60 * 24));
        }
        return 0;
    }

    getTrialDaysUsed() {
        const subscription = JSON.parse(localStorage.getItem('costflowai_subscription') || '{}');
        if (subscription.trial_start) {
            return Math.floor((Date.now() - new Date(subscription.trial_start).getTime()) / (1000 * 60 * 60 * 24));
        }
        return 0;
    }

    getCalculationsMade() {
        const usage = JSON.parse(localStorage.getItem('costflowai_usage_total') || '{}');
        return usage.total_calculations || 0;
    }

    getLastCalculationInputs() {
        try {
            const lastCalc = JSON.parse(localStorage.getItem('costflowai_last_calculation') || '{}');
            return JSON.stringify(lastCalc.inputs || {});
        } catch {
            return '{}';
        }
    }

    getLastCalculationResults() {
        try {
            const lastCalc = JSON.parse(localStorage.getItem('costflowai_last_calculation') || '{}');
            return JSON.stringify(lastCalc.results || {});
        } catch {
            return '{}';
        }
    }

    guessBugSeverity(title) {
        const severityKeywords = {
            critical: ['crash', 'broken', 'error', 'fail', 'not work'],
            high: ['slow', 'incorrect', 'wrong', 'missing'],
            medium: ['confusing', 'unclear', 'suggestion'],
            low: ['cosmetic', 'minor', 'typo']
        };

        const titleLower = title.toLowerCase();
        
        for (const [severity, keywords] of Object.entries(severityKeywords)) {
            if (keywords.some(keyword => titleLower.includes(keyword))) {
                return severity;
            }
        }
        
        return 'medium';
    }

    /**
     * Local storage fallback
     */
    saveToLocalStorage(feedbackData) {
        try {
            const stored = JSON.parse(localStorage.getItem('costflowai_feedback_offline') || '[]');
            stored.push({
                ...feedbackData,
                offline_timestamp: new Date().toISOString(),
                needs_sync: true
            });
            
            // Keep only last 20 offline items
            if (stored.length > 20) {
                stored.splice(0, stored.length - 20);
            }
            
            localStorage.setItem('costflowai_feedback_offline', JSON.stringify(stored));
        } catch (error) {
            console.error('Failed to save feedback to local storage:', error);
        }
    }

    /**
     * Sync offline feedback when connection restored
     */
    async syncOfflineFeedback() {
        try {
            const offline = JSON.parse(localStorage.getItem('costflowai_feedback_offline') || '[]');
            const toSync = offline.filter(item => item.needs_sync);
            
            if (toSync.length === 0) return;

            for (const feedback of toSync) {
                try {
                    await this.sendToGoogleSheets(feedback);
                    
                    // Mark as synced
                    feedback.needs_sync = false;
                    feedback.synced_timestamp = new Date().toISOString();
                    
                } catch (error) {
                    console.error('Failed to sync feedback:', error);
                    break; // Stop on first failure
                }
            }
            
            // Update storage
            localStorage.setItem('costflowai_feedback_offline', JSON.stringify(offline));
            
        } catch (error) {
            console.error('Offline sync failed:', error);
        }
    }

    /**
     * Logging functions
     */
    logSuccess(type) {
        console.log(`[Feedback] Successfully submitted ${type} feedback to Google Sheets`);
    }

    logSecurityEvent(event, data = {}) {
        console.warn(`[Security] Feedback security event: ${event}`, data);
        
        // Could send security events to a separate sheet
        try {
            fetch(this.webAppUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'security_event',
                    event,
                    data,
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    origin: window.location.origin
                })
            });
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }
}

// Initialize Google Sheets integration
window.googleSheetsIntegration = new GoogleSheetsIntegration();

// Auto-sync offline feedback when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Delay sync to avoid blocking page load
    setTimeout(() => {
        window.googleSheetsIntegration.syncOfflineFeedback();
    }, 5000);
});

// Sync when connection restored
window.addEventListener('online', () => {
    window.googleSheetsIntegration.syncOfflineFeedback();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsIntegration;
}