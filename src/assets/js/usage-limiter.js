/**
 * CostFlowAI Usage Limiter System
 * Tracks calculator usage and enforces subscription limits
 * 
 * Features:
 * - 5 free uses per week
 * - Multiple tracking methods to prevent bypass
 * - Server-side validation for logged-in users
 * - Automatic weekly reset
 */

class UsageLimiter {
    constructor(config = {}) {
        this.FREE_LIMIT = config.freeLimit || 5;
        this.RESET_DAYS = config.resetDays || 7;
        this.STRIPE_CHECKOUT_URL = config.stripeUrl || 'https://buy.stripe.com/test_abc123';
        this.API_ENDPOINT = config.apiEndpoint || '/.netlify/functions/track-usage';
        
        // Storage keys
        this.STORAGE_KEY = 'costflowai_usage';
        this.FINGERPRINT_KEY = 'costflowai_fp';
        this.LAST_RESET_KEY = 'costflowai_reset';
        
        // Initialize
        this.init();
    }

    init() {
        // Generate or retrieve device fingerprint
        this.deviceFingerprint = this.getDeviceFingerprint();
        
        // Check and reset if needed
        this.checkResetPeriod();
        
        // Initialize usage data
        this.usageData = this.getUsageData();
        
        // Show usage counter on page
        this.displayUsageCounter();
    }

    /**
     * Generate a device fingerprint to prevent incognito bypass
     * Combines multiple browser characteristics
     */
    getDeviceFingerprint() {
        let fp = localStorage.getItem(this.FINGERPRINT_KEY);
        
        if (!fp) {
            // Create fingerprint from browser characteristics
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('CostFlowAI', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('CostFlowAI', 4, 17);
            
            const canvasData = canvas.toDataURL();
            
            // Combine with other browser properties
            const fingerprint = {
                canvas: canvasData.substring(0, 50), // Use partial canvas data
                screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                language: navigator.language,
                platform: navigator.platform,
                cores: navigator.hardwareConcurrency || 0,
                vendor: navigator.vendor,
                timestamp: Date.now()
            };
            
            // Create hash
            fp = btoa(JSON.stringify(fingerprint)).substring(0, 32);
            localStorage.setItem(this.FINGERPRINT_KEY, fp);
        }
        
        return fp;
    }

    /**
     * Get usage data from multiple sources
     */
    getUsageData() {
        // Try localStorage first
        let data = this.getLocalStorage();
        
        // If user is logged in, sync with server
        const userEmail = this.getUserEmail();
        if (userEmail) {
            this.syncWithServer(userEmail);
        }
        
        return data;
    }

    /**
     * Get data from localStorage
     */
    getLocalStorage() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Validate data structure
                if (parsed.count !== undefined && parsed.weekStart !== undefined) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Error reading usage data:', e);
        }
        
        // Return default
        return {
            count: 0,
            weekStart: Date.now(),
            fingerprint: this.deviceFingerprint,
            history: []
        };
    }

    /**
     * Save usage data to localStorage
     */
    saveLocalStorage(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            
            // Also save to sessionStorage as backup
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            
            // Save to cookie as another backup (httpOnly would be better but needs server)
            document.cookie = `${this.STORAGE_KEY}=${JSON.stringify(data)}; path=/; max-age=${60*60*24*7}; SameSite=Strict`;
        } catch (e) {
            console.error('Error saving usage data:', e);
        }
    }

    /**
     * Check if reset period has passed
     */
    checkResetPeriod() {
        const lastReset = localStorage.getItem(this.LAST_RESET_KEY);
        const now = Date.now();
        const weekInMs = this.RESET_DAYS * 24 * 60 * 60 * 1000;
        
        if (!lastReset || (now - parseInt(lastReset)) > weekInMs) {
            this.resetUsage();
            localStorage.setItem(this.LAST_RESET_KEY, now.toString());
        }
    }

    /**
     * Reset usage counter
     */
    resetUsage() {
        const data = {
            count: 0,
            weekStart: Date.now(),
            fingerprint: this.deviceFingerprint,
            history: []
        };
        
        this.usageData = data;
        this.saveLocalStorage(data);
        
        // If logged in, reset on server too
        const userEmail = this.getUserEmail();
        if (userEmail) {
            this.resetServerUsage(userEmail);
        }
    }

    /**
     * Track a calculator usage
     * @returns {boolean} true if allowed, false if limit reached
     */
    async trackUsage(calculatorType = 'general') {
        // TEMPORARILY DISABLED: All calculators are free during Stripe setup
        // Silent operation - no console logs in production
        
        // Hide usage counter if it exists
        const existing = document.getElementById('usage-counter-widget');
        if (existing) existing.remove();
        
        return true; // Always allow usage
        
        /* ORIGINAL CODE - COMMENTED OUT DURING STRIPE SETUP
        // Check current usage
        if (this.usageData.count >= this.FREE_LIMIT) {
            this.showUpgradeModal();
            return false;
        }
        
        // Increment usage
        this.usageData.count++;
        this.usageData.history.push({
            timestamp: Date.now(),
            calculator: calculatorType,
            fingerprint: this.deviceFingerprint
        });
        
        // Save locally
        this.saveLocalStorage(this.usageData);
        
        // Update display
        this.displayUsageCounter();
        
        // Track on server if logged in
        const userEmail = this.getUserEmail();
        if (userEmail) {
            await this.trackServerUsage(userEmail, calculatorType);
        }
        
        // Show warning if approaching limit
        if (this.usageData.count === this.FREE_LIMIT - 1) {
            this.showWarning();
        }
        
        return true;
        */
    }

    /**
     * Display usage counter on page
     */
    displayUsageCounter() {
        // TEMPORARILY DISABLED: Remove any usage counters during free period
        const existing = document.getElementById('usage-counter-widget');
        if (existing) existing.remove();
        return; // Don't display usage counter during free period
        
        /* ORIGINAL CODE - COMMENTED OUT DURING STRIPE SETUP
        const remaining = Math.max(0, this.FREE_LIMIT - this.usageData.count);
        
        // Remove existing counter
        const existing = document.getElementById('usage-counter-widget');
        if (existing) existing.remove();
        
        // Create counter widget
        const widget = document.createElement('div');
        widget.id = 'usage-counter-widget';
        widget.className = 'usage-counter-widget';
        widget.innerHTML = `
            <div class="usage-counter-content">
                <span class="usage-icon">🎯</span>
                <span class="usage-text">
                    <strong>${remaining}</strong> free ${remaining === 1 ? 'use' : 'uses'} remaining this week
                </span>
                ${remaining === 0 ? '<button class="upgrade-btn-small">Upgrade Now</button>' : ''}
            </div>
        `;
        
        // Add styles
        if (!document.getElementById('usage-counter-styles')) {
            const styles = document.createElement('style');
            styles.id = 'usage-counter-styles';
            styles.innerHTML = `
                .usage-counter-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 12px 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .usage-counter-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .usage-icon {
                    font-size: 24px;
                }
                
                .usage-text {
                    font-size: 14px;
                    color: #374151;
                }
                
                .usage-text strong {
                    color: ${remaining <= 2 ? '#ef4444' : '#10b981'};
                    font-size: 18px;
                }
                
                .upgrade-btn-small {
                    margin-left: 10px;
                    padding: 6px 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .upgrade-btn-small:hover {
                    transform: scale(1.05);
                }
                
                @media (max-width: 640px) {
                    .usage-counter-widget {
                        bottom: 10px;
                        right: 10px;
                        left: 10px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(widget);
        
        // Add click handler for upgrade button
        const upgradeBtn = widget.querySelector('.upgrade-btn-small');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.showUpgradeModal());
        }
        */
    }

    /**
     * Show warning when approaching limit
     */
    showWarning() {
        const toast = document.createElement('div');
        toast.className = 'usage-warning-toast';
        toast.innerHTML = `
            <div class="toast-content">
                ⚠️ <strong>Heads up!</strong> You have 1 free use remaining this week.
                <a href="#" class="toast-upgrade-link">Upgrade for unlimited access →</a>
            </div>
        `;
        
        // Add styles
        if (!document.getElementById('toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.innerHTML = `
                .usage-warning-toast {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #fef3c7;
                    border: 1px solid #f59e0b;
                    border-radius: 8px;
                    padding: 16px 24px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 10000;
                    animation: slideDown 0.3s ease;
                }
                
                @keyframes slideDown {
                    from {
                        transform: translate(-50%, -100%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, 0);
                        opacity: 1;
                    }
                }
                
                .toast-content {
                    color: #92400e;
                    font-size: 14px;
                }
                
                .toast-upgrade-link {
                    color: #92400e;
                    font-weight: 600;
                    margin-left: 10px;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Add click handler
        toast.querySelector('.toast-upgrade-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showUpgradeModal();
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => toast.remove(), 5000);
    }

    /**
     * Show upgrade modal
     */
    showUpgradeModal() {
        // TEMPORARILY DISABLED: Don't show upgrade modals during free period
        console.log('Upgrade modal temporarily disabled - all calculators are free');
        return;
        
        /* ORIGINAL CODE - COMMENTED OUT DURING STRIPE SETUP
        // Remove existing modal if any
        const existing = document.getElementById('upgrade-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'upgrade-modal';
        modal.className = 'upgrade-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <button class="modal-close">×</button>
                
                <div class="modal-header">
                    <div class="modal-icon">🚀</div>
                    <h2>You've Reached Your Weekly Limit!</h2>
                    <p>You've used all 5 free calculations this week.</p>
                </div>
                
                <div class="modal-body">
                    <div class="upgrade-benefits">
                        <h3>Upgrade to CostFlowAI Pro and Get:</h3>
                        <ul>
                            <li>✅ <strong>Unlimited calculations</strong> - No more limits!</li>
                            <li>✅ <strong>AI Photo Estimator</strong> - Upload photos for instant estimates</li>
                            <li>✅ <strong>ROI Maximizer</strong> - Optimize project profitability</li>
                            <li>✅ <strong>Professional Reports</strong> - Export detailed PDFs</li>
                            <li>✅ <strong>Priority Support</strong> - Get help within 24 hours</li>
                            <li>✅ <strong>All Premium Features</strong> - Full access to everything</li>
                        </ul>
                    </div>
                    
                    <div class="pricing-highlight">
                        <div class="price-tag">
                            <span class="price-old">$20/month</span>
                            <span class="price-new">$10</span>
                            <span class="price-label">First Month</span>
                        </div>
                        <div class="price-note">
                            50% OFF your first month, then $20/month. Cancel anytime.
                        </div>
                    </div>
                    
                    <button class="upgrade-btn-primary">
                        Upgrade Now - Start with $10 →
                    </button>
                    
                    <div class="modal-footer">
                        <p>💳 Secure payment via Stripe • 30-day money-back guarantee</p>
                        <a href="#" class="continue-limited">Continue with limited access</a>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        if (!document.getElementById('modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'modal-styles';
            styles.innerHTML = `
                .upgrade-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .modal-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                }
                
                .modal-content {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    border-radius: 16px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                    animation: slideUp 0.3s ease;
                }
                
                @keyframes slideUp {
                    from {
                        transform: translate(-50%, -40%);
                        opacity: 0;
                    }
                    to {
                        transform: translate(-50%, -50%);
                        opacity: 1;
                    }
                }
                
                .modal-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 32px;
                    color: #6b7280;
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.2s;
                }
                
                .modal-close:hover {
                    background: #f3f4f6;
                }
                
                .modal-header {
                    text-align: center;
                    padding: 40px 40px 20px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .modal-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                
                .modal-header h2 {
                    color: #111827;
                    font-size: 28px;
                    margin: 0 0 10px 0;
                }
                
                .modal-header p {
                    color: #6b7280;
                    font-size: 16px;
                    margin: 0;
                }
                
                .modal-body {
                    padding: 30px 40px 40px;
                }
                
                .upgrade-benefits {
                    margin-bottom: 30px;
                }
                
                .upgrade-benefits h3 {
                    color: #111827;
                    font-size: 18px;
                    margin: 0 0 15px 0;
                }
                
                .upgrade-benefits ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .upgrade-benefits li {
                    padding: 8px 0;
                    color: #374151;
                    font-size: 15px;
                }
                
                .pricing-highlight {
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border: 2px solid #0ea5e9;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }
                
                .price-tag {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 10px;
                }
                
                .price-old {
                    color: #9ca3af;
                    text-decoration: line-through;
                    font-size: 20px;
                }
                
                .price-new {
                    color: #0ea5e9;
                    font-size: 48px;
                    font-weight: bold;
                }
                
                .price-label {
                    color: #0369a1;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .price-note {
                    color: #0c4a6e;
                    font-size: 14px;
                }
                
                .upgrade-btn-primary {
                    width: 100%;
                    padding: 16px 32px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    margin: 20px 0;
                }
                
                .upgrade-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
                }
                
                .modal-footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                }
                
                .modal-footer p {
                    color: #6b7280;
                    font-size: 13px;
                    margin: 0 0 10px 0;
                }
                
                .continue-limited {
                    color: #6b7280;
                    font-size: 14px;
                    text-decoration: underline;
                }
                
                @media (max-width: 640px) {
                    .modal-content {
                        width: 95%;
                        max-height: 95vh;
                    }
                    
                    .modal-header, .modal-body {
                        padding: 20px;
                    }
                    
                    .price-new {
                        font-size: 36px;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(modal);
        
        // Add event handlers
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
        modal.querySelector('.continue-limited').addEventListener('click', (e) => {
            e.preventDefault();
            modal.remove();
        });
        
        // Upgrade button handler
        modal.querySelector('.upgrade-btn-primary').addEventListener('click', () => {
            // Track conversion event
            if (typeof gtag !== 'undefined') {
                gtag('event', 'begin_checkout', {
                    value: 10.00,
                    currency: 'USD',
                    items: [{
                        item_name: 'CostFlowAI Pro Monthly',
                        price: 10.00
                    }]
                });
            }
            
            // Redirect to Stripe checkout
            window.location.href = this.STRIPE_CHECKOUT_URL;
        });
        */
    }

    /**
     * Get user email if logged in
     */
    getUserEmail() {
        // Check various possible locations for user email
        // This depends on your authentication implementation
        
        // Check meta tag
        const metaEmail = document.querySelector('meta[name="user-email"]');
        if (metaEmail) return metaEmail.content;
        
        // Check global variable
        if (window.userEmail) return window.userEmail;
        
        // Check localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.email) return user.email;
            } catch (e) {}
        }
        
        return null;
    }

    /**
     * Sync usage with server
     */
    async syncWithServer(email) {
        try {
            const response = await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'sync',
                    email: email,
                    fingerprint: this.deviceFingerprint,
                    localData: this.usageData
                })
            });
            
            if (response.ok) {
                const serverData = await response.json();
                // Merge server data with local data (server takes precedence)
                if (serverData.count !== undefined) {
                    this.usageData.count = Math.max(this.usageData.count, serverData.count);
                    this.saveLocalStorage(this.usageData);
                    this.displayUsageCounter();
                }
            }
        } catch (error) {
            console.error('Failed to sync with server:', error);
        }
    }

    /**
     * Track usage on server
     */
    async trackServerUsage(email, calculatorType) {
        try {
            await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'track',
                    email: email,
                    calculatorType: calculatorType,
                    fingerprint: this.deviceFingerprint,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.error('Failed to track on server:', error);
        }
    }

    /**
     * Reset usage on server
     */
    async resetServerUsage(email) {
        try {
            await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'reset',
                    email: email,
                    fingerprint: this.deviceFingerprint
                })
            });
        } catch (error) {
            console.error('Failed to reset on server:', error);
        }
    }

    /**
     * Check if user has active subscription
     */
    async checkSubscription() {
        const email = this.getUserEmail();
        if (!email) return false;
        
        try {
            const response = await fetch('/.netlify/functions/check-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.hasActiveSubscription;
            }
        } catch (error) {
            console.error('Failed to check subscription:', error);
        }
        
        return false;
    }
}

// Initialize globally
window.UsageLimiter = UsageLimiter;

// Auto-initialize on DOM ready if not already initialized
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.usageLimiterInstance) {
            window.usageLimiterInstance = new UsageLimiter({
                stripeUrl: 'https://buy.stripe.com/test_abc123' // Replace with your actual Stripe URL
            });
        }
    });
} else {
    if (!window.usageLimiterInstance) {
        window.usageLimiterInstance = new UsageLimiter({
            stripeUrl: 'https://buy.stripe.com/test_abc123' // Replace with your actual Stripe URL
        });
    }
}