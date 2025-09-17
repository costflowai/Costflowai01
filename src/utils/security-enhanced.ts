/**
 * Enhanced Security System v2.0
 * Enterprise-grade security with advanced threat detection and protection
 */

interface SecurityConfig {
  enableCSP: boolean;
  enableRateLimiting: boolean;
  enableInputSanitization: boolean;
  enableBotDetection: boolean;
  enableAuditLogging: boolean;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  suspiciousPatterns: RegExp[];
  blockedCountries: string[];
  trustedDomains: string[];
}

interface SecurityEvent {
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  userAgent: string;
  ip?: string;
  fingerprint: string;
}

interface ThreatIntelligence {
  knownBadIPs: Set<string>;
  knownBadUserAgents: Set<string>;
  suspiciousPatterns: RegExp[];
  reputationScores: Map<string, number>;
  lastUpdated: Date;
}

class EnhancedSecuritySystem {
  private config: SecurityConfig;
  private threatIntel: ThreatIntelligence;
  private requestCounts: Map<string, { minute: number; hour: number; lastReset: Date }> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private fingerprint: string;
  private csrfToken: string;
  private sessionId: string;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableCSP: true,
      enableRateLimiting: true,
      enableInputSanitization: true,
      enableBotDetection: true,
      enableAuditLogging: true,
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      suspiciousPatterns: [
        /\b(script|javascript|vbscript|onload|onerror)\b/i,
        /<[^>]*>/g,
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /\b(union|select|insert|update|delete|drop|create|alter)\b/i,
        /\b(eval|exec|system|shell_exec)\b/i,
        /(\.\.\/){3,}/,
        /\0/,
        /\x00/
      ],
      blockedCountries: [],
      trustedDomains: ['costflowai.com', 'localhost'],
      ...config
    };

    this.threatIntel = {
      knownBadIPs: new Set(),
      knownBadUserAgents: new Set([
        'sqlmap',
        'nikto',
        'nessus',
        'masscan',
        'nmap',
        'dirbuster',
        'gobuster'
      ]),
      suspiciousPatterns: this.config.suspiciousPatterns,
      reputationScores: new Map(),
      lastUpdated: new Date()
    };

    this.fingerprint = this.generateFingerprint();
    this.csrfToken = this.generateCSRFToken();
    this.sessionId = this.generateSessionId();

    this.initialize();
  }

  private initialize(): void {
    if (this.config.enableCSP) {
      this.enforceCSP();
    }

    if (this.config.enableBotDetection) {
      this.initializeBotDetection();
    }

    if (this.config.enableRateLimiting) {
      this.initializeRateLimiting();
    }

    this.setupEventListeners();
    this.loadThreatIntelligence();
    this.startSecurityMonitoring();

    console.log('🔒 Enhanced Security System v2.0 initialized');
  }

  private enforceCSP(): void {
    const nonce = this.generateNonce();
    
    const cspDirectives = [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
      `style-src 'self' 'unsafe-inline' https:`,
      `img-src 'self' data: https:`,
      `font-src 'self' https:`,
      `connect-src 'self' https:`,
      `media-src 'self'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `block-all-mixed-content`,
      `upgrade-insecure-requests`
    ];

    const csp = cspDirectives.join('; ');
    
    // Set CSP via meta tag for client-side enforcement
    const metaCSP = document.createElement('meta');
    metaCSP.httpEquiv = 'Content-Security-Policy';
    metaCSP.content = csp;
    document.head.appendChild(metaCSP);

    // Store nonce for script validation
    (window as any).__csp_nonce = nonce;
  }

  private initializeBotDetection(): void {
    // Mouse movement tracking
    let mouseMovements = 0;
    let keystrokes = 0;
    let scrollEvents = 0;
    let touchEvents = 0;

    const trackHumanBehavior = () => {
      document.addEventListener('mousemove', () => mouseMovements++);
      document.addEventListener('keydown', () => keystrokes++);
      document.addEventListener('scroll', () => scrollEvents++);
      document.addEventListener('touchstart', () => touchEvents++);

      // Evaluate after 10 seconds
      setTimeout(() => {
        const humanScore = this.calculateHumanScore(mouseMovements, keystrokes, scrollEvents, touchEvents);
        
        if (humanScore < 0.3) {
          this.logSecurityEvent('bot_detection', 'high', {
            humanScore,
            mouseMovements,
            keystrokes,
            scrollEvents,
            touchEvents
          });
        }
      }, 10000);
    };

    trackHumanBehavior();
  }

  private calculateHumanScore(mouse: number, keys: number, scroll: number, touch: number): number {
    let score = 0;
    
    // Mouse movement score (0-0.4)
    score += Math.min(mouse / 50, 0.4);
    
    // Keystroke score (0-0.3)
    score += Math.min(keys / 20, 0.3);
    
    // Scroll score (0-0.2)
    score += Math.min(scroll / 10, 0.2);
    
    // Touch score (0-0.1) - for mobile
    score += Math.min(touch / 5, 0.1);

    return Math.min(score, 1.0);
  }

  private initializeRateLimiting(): void {
    // Override fetch to implement rate limiting
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (!this.checkRateLimit(url)) {
        throw new Error('Rate limit exceeded');
      }

      return originalFetch(input, init);
    };
  }

  private checkRateLimit(url: string): boolean {
    const key = this.fingerprint;
    const now = new Date();
    
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, {
        minute: 0,
        hour: 0,
        lastReset: now
      });
    }

    const counts = this.requestCounts.get(key)!;
    
    // Reset counters if needed
    const timeSinceReset = now.getTime() - counts.lastReset.getTime();
    
    if (timeSinceReset > 60000) { // 1 minute
      counts.minute = 0;
    }
    
    if (timeSinceReset > 3600000) { // 1 hour
      counts.hour = 0;
      counts.lastReset = now;
    }

    // Check limits
    if (counts.minute >= this.config.maxRequestsPerMinute) {
      this.logSecurityEvent('rate_limit_exceeded', 'medium', {
        limit: 'minute',
        count: counts.minute,
        url
      });
      return false;
    }

    if (counts.hour >= this.config.maxRequestsPerHour) {
      this.logSecurityEvent('rate_limit_exceeded', 'high', {
        limit: 'hour',
        count: counts.hour,
        url
      });
      return false;
    }

    // Increment counters
    counts.minute++;
    counts.hour++;

    return true;
  }

  public sanitizeInput(input: string): string {
    if (!this.config.enableInputSanitization) {
      return input;
    }

    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Encode HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Check for suspicious patterns
    for (const pattern of this.config.suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        this.logSecurityEvent('suspicious_input', 'medium', {
          input: input.substring(0, 100),
          pattern: pattern.source
        });
        
        // Remove or replace suspicious content
        sanitized = sanitized.replace(pattern, '[FILTERED]');
      }
    }

    return sanitized;
  }

  public validateCSRFToken(token: string): boolean {
    return token === this.csrfToken;
  }

  public generateCSRFToken(): string {
    const token = this.generateSecureToken();
    this.csrfToken = token;
    
    // Add to all forms
    this.addCSRFTokenToForms();
    
    return token;
  }

  private addCSRFTokenToForms(): void {
    document.querySelectorAll('form').forEach(form => {
      let csrfInput = form.querySelector('input[name="csrf_token"]') as HTMLInputElement;
      
      if (!csrfInput) {
        csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        form.appendChild(csrfInput);
      }
      
      csrfInput.value = this.csrfToken;
    });
  }

  private setupEventListeners(): void {
    // Monitor form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.validateFormSubmission(form);
    });

    // Monitor suspicious activities
    document.addEventListener('copy', () => {
      this.logSecurityEvent('content_copied', 'low', {});
    });

    document.addEventListener('contextmenu', (event) => {
      // Log right-click events (could indicate scraping attempts)
      this.logSecurityEvent('context_menu', 'low', {
        target: (event.target as Element).tagName
      });
    });

    // Monitor console access attempts
    const originalConsole = console.log;
    console.log = (...args) => {
      this.logSecurityEvent('console_access', 'low', { args: args.slice(0, 3) });
      originalConsole.apply(console, args);
    };

    // Monitor DevTools
    this.detectDevTools();
  }

  private validateFormSubmission(form: HTMLFormElement): boolean {
    // Check CSRF token
    const csrfInput = form.querySelector('input[name="csrf_token"]') as HTMLInputElement;
    if (!csrfInput || !this.validateCSRFToken(csrfInput.value)) {
      this.logSecurityEvent('csrf_validation_failed', 'high', {
        form: form.action || form.id
      });
      return false;
    }

    // Validate all inputs
    const inputs = form.querySelectorAll('input[type="text"], input[type="email"], textarea');
    for (const input of inputs) {
      const sanitized = this.sanitizeInput((input as HTMLInputElement).value);
      if (sanitized !== (input as HTMLInputElement).value) {
        this.logSecurityEvent('input_sanitized', 'medium', {
          field: (input as HTMLInputElement).name,
          original: (input as HTMLInputElement).value.substring(0, 50)
        });
        (input as HTMLInputElement).value = sanitized;
      }
    }

    return true;
  }

  private detectDevTools(): void {
    let devtools = { open: false, orientation: null };
    
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          this.logSecurityEvent('devtools_opened', 'medium', {});
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Console detection
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: () => {
        this.logSecurityEvent('console_accessed', 'medium', {});
        throw new Error('Console access detected');
      }
    });

    setInterval(() => {
      console.dir(element);
    }, 1000);
  }

  private async loadThreatIntelligence(): Promise<void> {
    try {
      // In a real implementation, this would fetch from a threat intelligence API
      const response = await fetch('/api/threat-intelligence', {
        headers: {
          'X-CSRF-Token': this.csrfToken,
          'X-Session-ID': this.sessionId
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.updateThreatIntelligence(data);
      }
    } catch (error) {
      console.warn('Could not load threat intelligence:', error);
    }
  }

  private updateThreatIntelligence(data: any): void {
    if (data.badIPs) {
      data.badIPs.forEach((ip: string) => this.threatIntel.knownBadIPs.add(ip));
    }

    if (data.badUserAgents) {
      data.badUserAgents.forEach((ua: string) => this.threatIntel.knownBadUserAgents.add(ua));
    }

    if (data.reputationScores) {
      Object.entries(data.reputationScores).forEach(([key, score]) => {
        this.threatIntel.reputationScores.set(key, score as number);
      });
    }

    this.threatIntel.lastUpdated = new Date();
  }

  private startSecurityMonitoring(): void {
    // Monitor performance for potential DDoS
    setInterval(() => {
      if (performance.now() > 5000) { // 5 seconds since page load
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation && navigation.loadEventEnd - navigation.loadEventStart > 10000) {
          this.logSecurityEvent('slow_page_load', 'medium', {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart
          });
        }
      }
    }, 30000);

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
          this.logSecurityEvent('high_memory_usage', 'medium', {
            usedHeapSize: memory.usedJSHeapSize,
            totalHeapSize: memory.totalJSHeapSize
          });
        }
      }, 60000);
    }

    // Clean up old events
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      this.securityEvents = this.securityEvents.filter(
        event => new Date(event.timestamp).getTime() > oneHourAgo
      );
    }, 300000); // Every 5 minutes
  }

  private logSecurityEvent(type: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any): void {
    if (!this.config.enableAuditLogging) return;

    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      type,
      severity,
      details,
      userAgent: navigator.userAgent,
      fingerprint: this.fingerprint
    };

    this.securityEvents.push(event);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 Security Event [${severity.toUpperCase()}]:`, type, details);
    }

    // Send to security monitoring service
    if (severity === 'high' || severity === 'critical') {
      this.reportSecurityEvent(event);
    }

    // Trigger alerts for critical events
    if (severity === 'critical') {
      this.triggerSecurityAlert(event);
    }
  }

  private async reportSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/security/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken,
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to report security event:', error);
    }
  }

  private triggerSecurityAlert(event: SecurityEvent): void {
    // In a real implementation, this would trigger alerts via email, Slack, etc.
    console.error('🚨 CRITICAL SECURITY ALERT:', event);
    
    // Could also show user notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Security Alert', {
        body: `Critical security event detected: ${event.type}`,
        icon: '/assets/images/security-alert.png'
      });
    }
  }

  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('CostFlowAI Security Fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
      navigator.hardwareConcurrency,
      navigator.deviceMemory
    ].join('|');

    return this.hashString(fingerprint);
  }

  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private generateSessionId(): string {
    return this.generateSecureToken();
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Public API
  public getSecurityStatus(): {
    fingerprint: string;
    sessionId: string;
    eventCount: number;
    threatLevel: string;
  } {
    const recentEvents = this.securityEvents.filter(
      event => Date.now() - new Date(event.timestamp).getTime() < 3600000
    );

    const criticalCount = recentEvents.filter(e => e.severity === 'critical').length;
    const highCount = recentEvents.filter(e => e.severity === 'high').length;

    let threatLevel = 'low';
    if (criticalCount > 0) threatLevel = 'critical';
    else if (highCount > 2) threatLevel = 'high';
    else if (recentEvents.length > 10) threatLevel = 'medium';

    return {
      fingerprint: this.fingerprint,
      sessionId: this.sessionId,
      eventCount: recentEvents.length,
      threatLevel
    };
  }

  public getRecentEvents(limit: number = 10): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  public clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  public updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
let securityInstance: EnhancedSecuritySystem | null = null;

export function initializeSecurity(config?: Partial<SecurityConfig>): EnhancedSecuritySystem {
  if (!securityInstance) {
    securityInstance = new EnhancedSecuritySystem(config);
  }
  return securityInstance;
}

export function getSecurityInstance(): EnhancedSecuritySystem | null {
  return securityInstance;
}

export { EnhancedSecuritySystem, type SecurityConfig, type SecurityEvent };
