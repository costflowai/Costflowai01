/**
 * CostFlowAI Security Protection System
 * Comprehensive protection against attacks, abuse, and unauthorized access
 */

class SecurityProtectionSystem {
    constructor() {
        this.config = {
            // Rate limiting
            maxRequestsPerMinute: 30,
            maxRequestsPerHour: 500,
            
            // Input validation
            maxInputLength: 10000,
            allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
            maxFileSize: 5 * 1024 * 1024, // 5MB
            
            // Security headers
            csrfTokenExpiry: 30 * 60 * 1000, // 30 minutes
            
            // Abuse detection
            suspiciousPatterns: [
                /\b(script|javascript|vbscript|onload|onerror)\b/i,
                /<[^>]*>/g, // HTML tags
                /javascript:/i,
                /data:/i,
                /vbscript:/i,
                /\b(union|select|insert|update|delete|drop|create|alter)\b/i // SQL injection
            ],
            
            // Bot detection
            minMouseMovements: 3,
            minKeystrokes: 5,
            minTimeOnSite: 10000, // 10 seconds
            
            // Geoblocking (if needed)
            blockedCountries: [], // Add country codes if needed
            
            // IP reputation
            knownBadIPs: [],
            maxFailedAttempts: 5,
            lockoutDuration: 15 * 60 * 1000 // 15 minutes
        };
        
        this.state = {
            requestCount: { minute: 0, hour: 0 },
            lastRequestTime: Date.now(),
            mouseMovements: 0,
            keystrokes: 0,
            pageLoadTime: Date.now(),
            failedAttempts: 0,
            isLocked: false,
            csrfToken: null,
            fingerprint: null
        };
        
        this.init();
    }
    
    init() {
        this.generateCSRFToken();
        this.generateFingerprint();
        this.setupEventListeners();
        this.setupRequestInterception();
        this.setupFormProtection();
        this.setupClickjackingProtection();
        this.checkInitialSecurity();
        this.startSecurityMonitoring();
    }
    
    // ===== CSRF PROTECTION =====
    
    generateCSRFToken() {
        this.state.csrfToken = {
            value: this.generateSecureToken(),
            generated: Date.now()
        };
        
        // Add token to all forms
        this.addCSRFTokenToForms();
        
        // Set token in meta tag
        this.setCSRFMeta();
    }
    
    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    addCSRFTokenToForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            let csrfInput = form.querySelector('input[name="csrf_token"]');
            if (!csrfInput) {
                csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                form.appendChild(csrfInput);
            }
            csrfInput.value = this.state.csrfToken.value;
        });
    }
    
    setCSRFMeta() {
        let metaTag = document.querySelector('meta[name="csrf-token"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.name = 'csrf-token';
            document.head.appendChild(metaTag);
        }
        metaTag.content = this.state.csrfToken.value;
    }
    
    validateCSRFToken(token) {
        if (!this.state.csrfToken) return false;
        
        // Check if token expired
        if (Date.now() - this.state.csrfToken.generated > this.config.csrfTokenExpiry) {
            this.generateCSRFToken();
            return false;
        }
        
        return token === this.state.csrfToken.value;
    }
    
    // ===== INPUT VALIDATION & SANITIZATION =====
    
    validateInput(input, type = 'text') {
        if (!input) return { valid: false, error: 'Empty input' };
        
        // Length check
        if (input.length > this.config.maxInputLength) {
            return { valid: false, error: 'Input too long' };
        }
        
        // Check for suspicious patterns
        for (const pattern of this.config.suspiciousPatterns) {
            if (pattern.test(input)) {
                this.logSecurityEvent('suspicious_input', { pattern: pattern.source, input: input.substring(0, 100) });
                return { valid: false, error: 'Invalid characters detected' };
            }
        }
        
        // Type-specific validation
        switch (type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(input)) {
                    return { valid: false, error: 'Invalid email format' };
                }
                break;
                
            case 'number':
                if (isNaN(parseFloat(input))) {
                    return { valid: false, error: 'Invalid number format' };
                }
                break;
                
            case 'url':
                try {
                    const url = new URL(input);
                    if (!['http:', 'https:'].includes(url.protocol)) {
                        return { valid: false, error: 'Invalid URL protocol' };
                    }
                } catch {
                    return { valid: false, error: 'Invalid URL format' };
                }
                break;
        }
        
        return { valid: true, sanitized: this.sanitizeInput(input) };
    }
    
    sanitizeInput(input) {
        return input
            .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
            .replace(/<[^>]+>/g, '') // Remove HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/data:/gi, '') // Remove data: URLs
            .replace(/vbscript:/gi, '') // Remove vbscript: URLs
            .trim();
    }
    
    validateFile(file) {
        // Check file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!this.config.allowedFileTypes.includes(extension)) {
            return { valid: false, error: 'File type not allowed' };
        }
        
        // Check file size
        if (file.size > this.config.maxFileSize) {
            return { valid: false, error: 'File too large' };
        }
        
        // Check MIME type matches extension
        const expectedMimeTypes = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png'
        };
        
        if (file.type !== expectedMimeTypes[extension]) {
            return { valid: false, error: 'File type mismatch' };
        }
        
        return { valid: true };
    }
    
    // ===== RATE LIMITING =====
    
    checkRateLimit() {
        const now = Date.now();
        const minuteAgo = now - 60 * 1000;
        const hourAgo = now - 60 * 60 * 1000;
        
        // Reset counters if time windows passed
        if (this.state.lastRequestTime < minuteAgo) {
            this.state.requestCount.minute = 0;
        }
        if (this.state.lastRequestTime < hourAgo) {
            this.state.requestCount.hour = 0;
        }
        
        // Check limits
        if (this.state.requestCount.minute >= this.config.maxRequestsPerMinute) {
            this.logSecurityEvent('rate_limit_exceeded', { type: 'minute', count: this.state.requestCount.minute });
            return { allowed: false, error: 'Too many requests per minute' };
        }
        
        if (this.state.requestCount.hour >= this.config.maxRequestsPerHour) {
            this.logSecurityEvent('rate_limit_exceeded', { type: 'hour', count: this.state.requestCount.hour });
            return { allowed: false, error: 'Too many requests per hour' };
        }
        
        // Update counters
        this.state.requestCount.minute++;
        this.state.requestCount.hour++;
        this.state.lastRequestTime = now;
        
        return { allowed: true };
    }
    
    // ===== BOT DETECTION =====
    
    generateFingerprint() {
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            plugins: Array.from(navigator.plugins || []).map(p => p.name).sort(),
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency,
            maxTouchPoints: navigator.maxTouchPoints
        };
        
        // Create hash of fingerprint
        this.state.fingerprint = this.hashObject(fingerprint);
    }
    
    hashObject(obj) {
        const str = JSON.stringify(obj);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    
    detectBot() {
        const timeOnSite = Date.now() - this.state.pageLoadTime;
        
        const botIndicators = {
            noMouseMovement: this.state.mouseMovements < this.config.minMouseMovements && timeOnSite > this.config.minTimeOnSite,
            noKeystrokes: this.state.keystrokes < this.config.minKeystrokes && timeOnSite > this.config.minTimeOnSite,
            suspiciousUserAgent: this.isSuspiciousUserAgent(),
            noJavaScript: typeof window.addEventListener === 'undefined',
            automatedBehavior: this.detectAutomatedBehavior(),
            headlessBrowser: this.detectHeadlessBrowser()
        };
        
        const botScore = Object.values(botIndicators).filter(Boolean).length;
        
        if (botScore >= 3) {
            this.logSecurityEvent('bot_detected', { indicators: botIndicators, score: botScore });
            return true;
        }
        
        return false;
    }
    
    isSuspiciousUserAgent() {
        const ua = navigator.userAgent.toLowerCase();
        const botPatterns = [
            'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget',
            'python', 'java', 'go-http', 'postman', 'insomnia'
        ];
        
        return botPatterns.some(pattern => ua.includes(pattern));
    }
    
    detectAutomatedBehavior() {
        // Check for rapid, identical requests
        const requests = JSON.parse(localStorage.getItem('costflowai_request_timing') || '[]');
        if (requests.length < 3) return false;
        
        const intervals = requests.slice(1).map((time, i) => time - requests[i]);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) / intervals.length;
        
        // Very consistent timing suggests automation
        return variance < 100 && avgInterval < 1000;
    }
    
    detectHeadlessBrowser() {
        // Check for headless browser indicators
        return (
            navigator.webdriver === true ||
            window.outerHeight === 0 ||
            window.outerWidth === 0 ||
            !window.chrome || // Chrome-specific
            typeof window.InstallTrigger !== 'undefined' // Firefox-specific
        );
    }
    
    // ===== FORM PROTECTION =====
    
    setupFormProtection() {
        document.addEventListener('submit', (e) => {
            if (!this.validateFormSubmission(e.target)) {
                e.preventDefault();
                this.showSecurityError('Form validation failed');
            }
        }, true);
    }
    
    validateFormSubmission(form) {
        // Check CSRF token
        const csrfInput = form.querySelector('input[name="csrf_token"]');
        if (!csrfInput || !this.validateCSRFToken(csrfInput.value)) {
            this.logSecurityEvent('csrf_validation_failed');
            return false;
        }
        
        // Check rate limiting
        const rateLimitResult = this.checkRateLimit();
        if (!rateLimitResult.allowed) {
            return false;
        }
        
        // Check for bot behavior
        if (this.detectBot()) {
            return false;
        }
        
        // Validate all inputs
        const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
        for (const input of inputs) {
            const validation = this.validateInput(input.value, input.type);
            if (!validation.valid) {
                this.logSecurityEvent('input_validation_failed', { field: input.name, error: validation.error });
                return false;
            }
            input.value = validation.sanitized;
        }
        
        return true;
    }
    
    // ===== REQUEST INTERCEPTION =====
    
    setupRequestInterception() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            if (!this.validateOutgoingRequest(args[0], args[1])) {
                throw new Error('Request blocked by security system');
            }
            
            const response = await originalFetch(...args);
            this.validateIncomingResponse(response);
            return response;
        };
        
        // Intercept XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            if (!securityProtection.validateOutgoingRequest(url, { method })) {
                throw new Error('Request blocked by security system');
            }
            return originalXHROpen.call(this, method, url, ...rest);
        };
    }
    
    validateOutgoingRequest(url, options = {}) {
        try {
            const requestUrl = new URL(url, window.location.origin);
            
            // Only allow requests to same origin or approved external domains
            const approvedDomains = [
                'costflowai.com',
                'script.google.com', // For Google Sheets integration
                'api.stripe.com', // For payments
                'js.stripe.com'
            ];
            
            if (requestUrl.origin !== window.location.origin) {
                const isApproved = approvedDomains.some(domain => 
                    requestUrl.hostname.endsWith(domain)
                );
                
                if (!isApproved) {
                    this.logSecurityEvent('blocked_external_request', { url: requestUrl.hostname });
                    return false;
                }
            }
            
            // Add security headers to requests
            if (options && typeof options === 'object') {
                options.headers = options.headers || {};
                options.headers['X-CSRF-Token'] = this.state.csrfToken?.value;
                options.headers['X-Fingerprint'] = this.state.fingerprint;
            }
            
            return true;
        } catch (error) {
            this.logSecurityEvent('request_validation_error', { error: error.message });
            return false;
        }
    }
    
    validateIncomingResponse(response) {
        // Check for suspicious response headers
        const suspiciousHeaders = ['x-powered-by', 'server'];
        suspiciousHeaders.forEach(header => {
            if (response.headers.get(header)) {
                this.logSecurityEvent('suspicious_response_header', { header });
            }
        });
    }
    
    // ===== CLICKJACKING PROTECTION =====
    
    setupClickjackingProtection() {
        // Check if page is in iframe
        if (window.self !== window.top) {
            // Allow iframe only from same origin
            try {
                if (window.top.location.origin !== window.location.origin) {
                    this.logSecurityEvent('clickjacking_attempt');
                    document.body.innerHTML = '<h1>This page cannot be displayed in a frame for security reasons.</h1>';
                    return;
                }
            } catch (e) {
                // Cross-origin iframe detected
                this.logSecurityEvent('clickjacking_attempt');
                document.body.innerHTML = '<h1>This page cannot be displayed in a frame for security reasons.</h1>';
                return;
            }
        }
        
        // Set frame-busting headers via meta tag
        const frameOptions = document.createElement('meta');
        frameOptions.httpEquiv = 'X-Frame-Options';
        frameOptions.content = 'SAMEORIGIN';
        document.head.appendChild(frameOptions);
    }
    
    // ===== EVENT LISTENERS =====
    
    setupEventListeners() {
        // Track user interaction for bot detection
        document.addEventListener('mousemove', () => {
            this.state.mouseMovements++;
        }, { passive: true });
        
        document.addEventListener('keydown', () => {
            this.state.keystrokes++;
        }, { passive: true });
        
        // Track request timing
        document.addEventListener('click', () => {
            this.recordRequestTiming();
        }, { passive: true });
        
        // Monitor for suspicious activity
        document.addEventListener('contextmenu', (e) => {
            // Optionally disable right-click in sensitive areas
            if (e.target.matches('.sensitive-data, .payment-form')) {
                e.preventDefault();
            }
        });
        
        // Monitor for devtools
        this.detectDevTools();
    }
    
    recordRequestTiming() {
        const timings = JSON.parse(localStorage.getItem('costflowai_request_timing') || '[]');
        timings.push(Date.now());
        
        // Keep only last 10 timings
        if (timings.length > 10) {
            timings.shift();
        }
        
        localStorage.setItem('costflowai_request_timing', JSON.stringify(timings));
    }
    
    detectDevTools() {
        let devtools = false;
        
        const detector = {
            open: false,
            orientation: null
        };
        
        setInterval(() => {
            const threshold = 160;
            
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!detector.open) {
                    detector.open = true;
                    this.logSecurityEvent('devtools_opened');
                }
            } else {
                detector.open = false;
            }
        }, 500);
    }
    
    // ===== SECURITY MONITORING =====
    
    startSecurityMonitoring() {
        // Check security status every 30 seconds
        setInterval(() => {
            this.performSecurityCheck();
        }, 30000);
        
        // Monitor performance for potential DDoS
        this.monitorPerformance();
    }
    
    performSecurityCheck() {
        // Refresh CSRF token if expired
        if (this.state.csrfToken && 
            Date.now() - this.state.csrfToken.generated > this.config.csrfTokenExpiry) {
            this.generateCSRFToken();
        }
        
        // Check for security policy violations
        this.checkSecurityPolicyViolations();
        
        // Monitor local storage for tampering
        this.checkLocalStorageIntegrity();
    }
    
    checkSecurityPolicyViolations() {
        // Check if CSP is in place
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!cspMeta) {
            this.logSecurityEvent('missing_csp');
        }
        
        // Check for inline scripts (security risk)
        const inlineScripts = document.querySelectorAll('script:not([src])');
        if (inlineScripts.length > 0) {
            this.logSecurityEvent('inline_scripts_detected', { count: inlineScripts.length });
        }
    }
    
    checkLocalStorageIntegrity() {
        try {
            // Check if critical security data has been tampered with
            const criticalKeys = ['costflowai_subscription', 'costflowai_usage_'];
            
            criticalKeys.forEach(keyPrefix => {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith(keyPrefix)) {
                        const value = localStorage.getItem(key);
                        try {
                            JSON.parse(value);
                        } catch (e) {
                            this.logSecurityEvent('localstorage_tampering', { key });
                            localStorage.removeItem(key);
                        }
                    }
                }
            });
        } catch (error) {
            this.logSecurityEvent('localstorage_check_failed', { error: error.message });
        }
    }
    
    monitorPerformance() {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            
            entries.forEach(entry => {
                // Monitor for unusually slow responses (potential DDoS)
                if (entry.responseEnd - entry.responseStart > 5000) {
                    this.logSecurityEvent('slow_response_detected', { 
                        url: entry.name, 
                        duration: entry.responseEnd - entry.responseStart 
                    });
                }
                
                // Monitor for failed requests
                if (entry.transferSize === 0 && entry.decodedBodySize === 0) {
                    this.logSecurityEvent('failed_request', { url: entry.name });
                }
            });
        });
        
        observer.observe({ entryTypes: ['navigation', 'resource'] });
    }
    
    // ===== SECURITY EVENT LOGGING =====
    
    logSecurityEvent(event, data = {}) {
        const logEntry = {
            event,
            data,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            fingerprint: this.state.fingerprint,
            ip: this.getClientIP(), // If available
            sessionId: this.getSessionId()
        };
        
        // Store locally
        this.storeSecurityLog(logEntry);
        
        // Send to server if critical
        if (this.isCriticalEvent(event)) {
            this.sendSecurityAlert(logEntry);
        }
        
        console.warn('[Security]', event, data);
    }
    
    storeSecurityLog(logEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('costflowai_security_logs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 50 logs
            if (logs.length > 50) {
                logs.shift();
            }
            
            localStorage.setItem('costflowai_security_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Failed to store security log:', error);
        }
    }
    
    isCriticalEvent(event) {
        const criticalEvents = [
            'bot_detected',
            'clickjacking_attempt',
            'csrf_validation_failed',
            'suspicious_input',
            'rate_limit_exceeded',
            'blocked_external_request'
        ];
        
        return criticalEvents.includes(event);
    }
    
    async sendSecurityAlert(logEntry) {
        try {
            // Send to security monitoring endpoint
            await fetch('/api/security-alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.state.csrfToken?.value
                },
                body: JSON.stringify({
                    alert: logEntry,
                    urgent: this.isUrgentEvent(logEntry.event)
                })
            });
        } catch (error) {
            console.error('Failed to send security alert:', error);
        }
    }
    
    isUrgentEvent(event) {
        const urgentEvents = [
            'clickjacking_attempt',
            'suspicious_input',
            'bot_detected'
        ];
        
        return urgentEvents.includes(event);
    }
    
    // ===== ADDITIONAL SECURITY CHECKS =====
    
    checkInitialSecurity() {
        // Verify HTTPS
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            this.logSecurityEvent('insecure_connection');
            this.showSecurityWarning('This site should be accessed over HTTPS for security.');
        }
        
        // Check referrer policy
        const referrerPolicy = document.querySelector('meta[name="referrer"]');
        if (!referrerPolicy || referrerPolicy.content !== 'strict-origin-when-cross-origin') {
            this.logSecurityEvent('missing_referrer_policy');
        }
        
        // Verify Content Security Policy
        this.checkContentSecurityPolicy();
        
        // Check for mixed content
        this.checkMixedContent();
    }
    
    checkContentSecurityPolicy() {
        // Check if CSP is properly configured
        const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!csp) {
            // Add basic CSP
            const cspMeta = document.createElement('meta');
            cspMeta.httpEquiv = 'Content-Security-Policy';
            cspMeta.content = "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://script.google.com https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://script.google.com https://api.stripe.com;";
            document.head.appendChild(cspMeta);
        }
    }
    
    checkMixedContent() {
        // Check for HTTP resources on HTTPS page
        if (location.protocol === 'https:') {
            const httpResources = document.querySelectorAll('[src^="http:"], [href^="http:"]');
            if (httpResources.length > 0) {
                this.logSecurityEvent('mixed_content_detected', { count: httpResources.length });
            }
        }
    }
    
    // ===== USER INTERFACE =====
    
    showSecurityError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000;
                        background: #fee2e2; color: #dc2626; padding: 15px 20px;
                        border-radius: 8px; border-left: 4px solid #dc2626;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 400px;">
                <h4 style="margin: 0 0 8px; font-size: 14px;">🔒 Security Alert</h4>
                <p style="margin: 0; font-size: 13px;">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="position: absolute; top: 8px; right: 12px;
                               background: none; border: none; color: #dc2626;
                               cursor: pointer; font-size: 16px;">×</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 10000);
    }
    
    showSecurityWarning(message) {
        const warningDiv = document.createElement('div');
        warningDiv.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000;
                        background: #fef3c7; color: #d97706; padding: 15px 20px;
                        border-radius: 8px; border-left: 4px solid #f59e0b;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 400px;">
                <h4 style="margin: 0 0 8px; font-size: 14px;">⚠️ Security Warning</h4>
                <p style="margin: 0; font-size: 13px;">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="position: absolute; top: 8px; right: 12px;
                               background: none; border: none; color: #d97706;
                               cursor: pointer; font-size: 16px;">×</button>
            </div>
        `;
        
        document.body.appendChild(warningDiv);
        setTimeout(() => warningDiv.remove(), 8000);
    }
    
    // ===== UTILITY FUNCTIONS =====
    
    getClientIP() {
        // Client-side IP detection is limited, server-side is preferred
        return null;
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('costflowai_security_session');
        if (!sessionId) {
            sessionId = this.generateSecureToken();
            sessionStorage.setItem('costflowai_security_session', sessionId);
        }
        return sessionId;
    }
    
    // ===== PUBLIC API =====
    
    /**
     * Validate user input before processing
     */
    validateUserInput(input, type = 'text') {
        return this.validateInput(input, type);
    }
    
    /**
     * Check if request should be allowed
     */
    shouldAllowRequest() {
        const rateLimitResult = this.checkRateLimit();
        if (!rateLimitResult.allowed) {
            this.showSecurityError(rateLimitResult.error);
            return false;
        }
        
        if (this.detectBot()) {
            this.showSecurityError('Automated access detected. Please verify you are human.');
            return false;
        }
        
        return true;
    }
    
    /**
     * Get security headers for requests
     */
    getSecurityHeaders() {
        return {
            'X-CSRF-Token': this.state.csrfToken?.value,
            'X-Fingerprint': this.state.fingerprint,
            'X-Requested-With': 'XMLHttpRequest'
        };
    }
    
    /**
     * Report security issue
     */
    reportSecurityIssue(issue, details = {}) {
        this.logSecurityEvent('user_reported_issue', { issue, details });
    }
}

// Initialize security protection
const securityProtection = new SecurityProtectionSystem();

// Make it globally available
window.securityProtection = securityProtection;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityProtectionSystem;
}

// Expose security validation functions globally
window.validateUserInput = (input, type) => securityProtection.validateUserInput(input, type);
window.shouldAllowRequest = () => securityProtection.shouldAllowRequest();
window.getSecurityHeaders = () => securityProtection.getSecurityHeaders();