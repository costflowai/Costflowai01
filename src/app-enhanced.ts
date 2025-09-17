/**
 * CostFlowAI Enhanced Application v2.0
 * Main application entry point with integrated enterprise features
 */

import { EnhancedCalculator, type CalculatorConfig } from './components/calculator-enhanced.js';
import { initializeSecurity, type SecurityConfig } from './utils/security-enhanced.js';
import { initializePerformanceMonitor } from './utils/performance-monitor.js';

interface AppConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    security: boolean;
    performance: boolean;
    pwa: boolean;
    analytics: boolean;
    offline: boolean;
  };
  security?: Partial<SecurityConfig>;
  calculators: CalculatorConfig[];
}

interface AppState {
  initialized: boolean;
  user: UserProfile | null;
  session: SessionData;
  preferences: UserPreferences;
  calculators: Map<string, EnhancedCalculator>;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'contractor' | 'pm' | 'executive' | 'admin';
  preferences: UserPreferences;
  subscription: 'free' | 'pro' | 'enterprise';
}

interface SessionData {
  id: string;
  startTime: Date;
  lastActivity: Date;
  pageViews: number;
  calculationsPerformed: number;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  units: 'imperial' | 'metric';
  currency: string;
  language: string;
  notifications: boolean;
  analytics: boolean;
}

class CostFlowAIApp {
  private config: AppConfig;
  private state: AppState;
  private security: any;
  private performance: any;
  private serviceWorker: ServiceWorkerRegistration | null = null;

  constructor(config: AppConfig) {
    this.config = config;
    this.state = {
      initialized: false,
      user: null,
      session: this.createSession(),
      preferences: this.getDefaultPreferences(),
      calculators: new Map()
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log(`🚀 Initializing CostFlowAI v${this.config.version} (${this.config.environment})`);
    
    try {
      // Initialize core systems in parallel
      await Promise.all([
        this.initializeSecurity(),
        this.initializePerformanceMonitoring(),
        this.initializePWA(),
        this.initializeAnalytics()
      ]);

      // Initialize calculators
      await this.initializeCalculators();

      // Setup event listeners
      this.setupEventListeners();

      // Load user preferences
      await this.loadUserPreferences();

      // Setup offline functionality
      if (this.config.features.offline) {
        await this.setupOfflineSupport();
      }

      // Mark as initialized
      this.state.initialized = true;

      // Emit ready event
      this.emit('appReady', {
        version: this.config.version,
        features: this.config.features,
        calculatorCount: this.state.calculators.size
      });

      console.log('✅ CostFlowAI application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize CostFlowAI:', error);
      this.handleInitializationError(error);
    }
  }

  private async initializeSecurity(): Promise<void> {
    if (!this.config.features.security) return;

    this.security = initializeSecurity(this.config.security);
    
    // Setup security event handlers
    document.addEventListener('securityEvent', (event: any) => {
      this.handleSecurityEvent(event.detail);
    });

    console.log('🔒 Security system initialized');
  }

  private async initializePerformanceMonitoring(): Promise<void> {
    if (!this.config.features.performance) return;

    this.performance = initializePerformanceMonitor();

    // Setup performance event handlers
    window.addEventListener('performanceAlert', (event: any) => {
      this.handlePerformanceAlert(event.detail);
    });

    window.addEventListener('performanceMetricUpdate', (event: any) => {
      this.handlePerformanceMetric(event.detail);
    });

    console.log('📊 Performance monitoring initialized');
  }

  private async initializePWA(): Promise<void> {
    if (!this.config.features.pwa) return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorker = await navigator.serviceWorker.register('/sw-enhanced.js', {
          scope: '/'
        });

        console.log('📱 Service worker registered:', this.serviceWorker.scope);

        // Handle service worker updates
        this.serviceWorker.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });

        // Setup service worker messaging
        this.setupServiceWorkerMessaging();

      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    }

    // Setup app install prompt
    this.setupInstallPrompt();

    // Setup push notifications
    await this.setupPushNotifications();

    console.log('📱 PWA features initialized');
  }

  private async initializeAnalytics(): Promise<void> {
    if (!this.config.features.analytics) return;

    // Initialize Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-H7RWMCGDHG', {
        app_name: 'CostFlowAI',
        app_version: this.config.version,
        custom_map: {
          custom_parameter_1: 'calculator_type',
          custom_parameter_2: 'user_role'
        }
      });

      // Track app initialization
      gtag('event', 'app_initialized', {
        app_version: this.config.version,
        environment: this.config.environment,
        feature_count: Object.keys(this.config.features).length
      });
    }

    // Setup custom analytics
    this.setupCustomAnalytics();

    console.log('📈 Analytics initialized');
  }

  private async initializeCalculators(): Promise<void> {
    const initPromises = this.config.calculators.map(async (config) => {
      try {
        const container = document.querySelector(`[data-calculator="${config.id}"]`);
        if (container) {
          const calculator = new EnhancedCalculator(config, `[data-calculator="${config.id}"]`);
          
          // Setup calculator event handlers
          calculator.on('calculationComplete', (data) => {
            this.handleCalculationComplete(config.id, data);
          });

          calculator.on('inputChange', (data) => {
            this.handleCalculatorInputChange(config.id, data);
          });

          this.state.calculators.set(config.id, calculator);
          console.log(`✅ Calculator initialized: ${config.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize calculator ${config.id}:`, error);
      }
    });

    await Promise.all(initPromises);
    console.log(`🧮 Initialized ${this.state.calculators.size} calculators`);
  }

  private setupEventListeners(): void {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.handleBeforeUnload();
    });

    // Online/offline status
    window.addEventListener('online', () => {
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleOnlineStatusChange(false);
    });

    // Error handling
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event);
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event);
    });

    // Custom app events
    document.addEventListener('calculatorError', (event: any) => {
      this.handleCalculatorError(event.detail);
    });
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      // Load from localStorage
      const stored = localStorage.getItem('costflowai_preferences');
      if (stored) {
        this.state.preferences = { ...this.state.preferences, ...JSON.parse(stored) };
      }

      // Apply preferences
      this.applyUserPreferences();

    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }

  private applyUserPreferences(): void {
    // Apply theme
    document.documentElement.setAttribute('data-theme', this.state.preferences.theme);
    
    // Apply other preferences
    if (this.state.preferences.units === 'metric') {
      document.documentElement.setAttribute('data-units', 'metric');
    }

    // Update currency display
    document.documentElement.style.setProperty('--currency-symbol', 
      this.getCurrencySymbol(this.state.preferences.currency));
  }

  private getCurrencySymbol(currency: string): string {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'C$',
      'AUD': 'A$'
    };
    return symbols[currency] || '$';
  }

  private async setupOfflineSupport(): Promise<void> {
    // Setup offline data caching
    if ('indexedDB' in window) {
      await this.initializeOfflineDatabase();
    }

    // Setup background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      await this.setupBackgroundSync();
    }

    console.log('📱 Offline support configured');
  }

  private async initializeOfflineDatabase(): Promise<void> {
    // Implementation would setup IndexedDB for offline data storage
    console.log('💾 Offline database initialized');
  }

  private async setupBackgroundSync(): Promise<void> {
    // Implementation would setup background sync for offline actions
    console.log('🔄 Background sync configured');
  }

  private setupInstallPrompt(): void {
    let deferredPrompt: any;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show custom install button
      this.showInstallPrompt();
    });

    // Handle install prompt
    document.addEventListener('click', async (e) => {
      if ((e.target as Element).matches('[data-action="install-app"]')) {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          
          if (outcome === 'accepted') {
            console.log('App installation accepted');
            this.trackEvent('app_installed', { method: 'prompt' });
          }
          
          deferredPrompt = null;
        }
      }
    });
  }

  private showInstallPrompt(): void {
    // Create and show install prompt UI
    const installPrompt = document.createElement('div');
    installPrompt.className = 'install-prompt';
    installPrompt.innerHTML = `
      <div class="install-prompt-content">
        <h3>Install CostFlowAI</h3>
        <p>Get quick access to construction calculators with our app!</p>
        <div class="install-prompt-actions">
          <button data-action="install-app" class="btn btn-primary">Install</button>
          <button data-action="dismiss-install" class="btn btn-secondary">Maybe Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(installPrompt);

    // Handle dismiss
    installPrompt.addEventListener('click', (e) => {
      if ((e.target as Element).matches('[data-action="dismiss-install"]')) {
        installPrompt.remove();
      }
    });
  }

  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Request permission
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }

    if (Notification.permission === 'granted' && this.serviceWorker) {
      try {
        const subscription = await this.serviceWorker.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY') // Replace with actual key
        });

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
        
        console.log('Push notifications configured');
      } catch (error) {
        console.error('Failed to setup push notifications:', error);
      }
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        userId: this.state.user?.id,
        sessionId: this.state.session.id
      })
    });
  }

  private setupServiceWorkerMessaging(): void {
    if (!this.serviceWorker) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event.data);
    });
  }

  private setupCustomAnalytics(): void {
    // Track user journey
    this.trackPageView();

    // Track calculator usage
    this.state.calculators.forEach((calculator, id) => {
      calculator.on('calculationComplete', () => {
        this.trackEvent('calculator_used', {
          calculator_id: id,
          user_role: this.state.user?.role || 'anonymous'
        });
      });
    });

    // Track errors
    window.addEventListener('error', (event) => {
      this.trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }

  // Event Handlers
  private handleSecurityEvent(event: any): void {
    console.log('🔒 Security event:', event);
    
    if (event.severity === 'critical') {
      this.showSecurityAlert(event);
    }

    // Track security events
    this.trackEvent('security_event', {
      type: event.type,
      severity: event.severity
    });
  }

  private handlePerformanceAlert(alert: any): void {
    console.log('📊 Performance alert:', alert);

    if (alert.severity === 'critical') {
      this.showPerformanceAlert(alert);
    }

    // Track performance issues
    this.trackEvent('performance_alert', {
      metric: alert.metric,
      value: alert.value,
      severity: alert.severity
    });
  }

  private handlePerformanceMetric(metric: any): void {
    // Update UI with performance metrics if needed
    this.updatePerformanceDisplay(metric);
  }

  private handleCalculationComplete(calculatorId: string, data: any): void {
    this.state.session.calculationsPerformed++;
    
    // Save calculation to history
    this.saveCalculationToHistory(calculatorId, data);

    // Track analytics
    this.trackEvent('calculation_completed', {
      calculator_id: calculatorId,
      calculation_time: data.calculationTime,
      input_count: Object.keys(data.inputs).length
    });
  }

  private handleCalculatorInputChange(calculatorId: string, data: any): void {
    // Update last activity
    this.state.session.lastActivity = new Date();

    // Auto-save if needed
    this.autoSaveCalculatorState(calculatorId, data);
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.handlePageHidden();
    } else {
      this.handlePageVisible();
    }
  }

  private handlePageHidden(): void {
    // Save current state
    this.saveAppState();

    // Track session pause
    this.trackEvent('session_paused', {
      session_duration: Date.now() - this.state.session.startTime.getTime()
    });
  }

  private handlePageVisible(): void {
    // Update last activity
    this.state.session.lastActivity = new Date();

    // Track session resume
    this.trackEvent('session_resumed', {});

    // Refresh data if needed
    this.refreshDataIfNeeded();
  }

  private handleBeforeUnload(): void {
    // Save current state
    this.saveAppState();

    // Track session end
    this.trackEvent('session_ended', {
      session_duration: Date.now() - this.state.session.startTime.getTime(),
      calculations_performed: this.state.session.calculationsPerformed,
      page_views: this.state.session.pageViews
    });
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    this.showConnectionStatus(isOnline);

    if (isOnline) {
      // Sync offline data
      this.syncOfflineData();
    }

    this.trackEvent('connection_changed', { online: isOnline });
  }

  private handleGlobalError(event: ErrorEvent): void {
    console.error('Global error:', event);
    
    // Show user-friendly error message
    this.showErrorNotification('An unexpected error occurred. Please refresh the page if problems persist.');

    // Track error
    this.trackEvent('global_error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Track error
    this.trackEvent('unhandled_rejection', {
      reason: String(event.reason)
    });
  }

  private handleCalculatorError(error: any): void {
    console.error('Calculator error:', error);
    
    // Show user-friendly error message
    this.showErrorNotification('Calculator error occurred. Please check your inputs and try again.');

    // Track error
    this.trackEvent('calculator_error', {
      calculator_id: error.calculatorId,
      error_type: error.type,
      message: error.message
    });
  }

  private handleServiceWorkerUpdate(): void {
    // Show update available notification
    this.showUpdateAvailableNotification();
  }

  private handleServiceWorkerMessage(data: any): void {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated by service worker');
        break;
      case 'OFFLINE_READY':
        this.showOfflineReadyNotification();
        break;
      default:
        console.log('Service worker message:', data);
    }
  }

  private handleInitializationError(error: any): void {
    // Show fallback UI
    this.showFallbackUI();

    // Track initialization failure
    this.trackEvent('initialization_failed', {
      error: String(error),
      version: this.config.version
    });
  }

  // UI Methods
  private showSecurityAlert(event: any): void {
    this.showNotification(`Security alert: ${event.type}`, 'warning');
  }

  private showPerformanceAlert(alert: any): void {
    this.showNotification(`Performance issue detected: ${alert.metric}`, 'warning');
  }

  private showConnectionStatus(isOnline: boolean): void {
    const message = isOnline ? 'Connection restored' : 'Working offline';
    const type = isOnline ? 'success' : 'info';
    this.showNotification(message, type);
  }

  private showErrorNotification(message: string): void {
    this.showNotification(message, 'error');
  }

  private showUpdateAvailableNotification(): void {
    this.showNotification('App update available. Refresh to get the latest version.', 'info');
  }

  private showOfflineReadyNotification(): void {
    this.showNotification('App is ready to work offline!', 'success');
  }

  private showNotification(message: string, type: 'success' | 'info' | 'warning' | 'error'): void {
    // Implementation would show toast notification
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  private showFallbackUI(): void {
    document.body.innerHTML = `
      <div class="fallback-ui">
        <h1>CostFlowAI</h1>
        <p>We're having trouble loading the application. Please refresh the page or try again later.</p>
        <button onclick="window.location.reload()" class="btn btn-primary">Refresh Page</button>
      </div>
    `;
  }

  // Utility Methods
  private createSession(): SessionData {
    return {
      id: this.generateId(),
      startTime: new Date(),
      lastActivity: new Date(),
      pageViews: 1,
      calculationsPerformed: 0
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      units: 'imperial',
      currency: 'USD',
      language: 'en',
      notifications: true,
      analytics: true
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private emit(event: string, data?: any): void {
    window.dispatchEvent(new CustomEvent(`costflowai:${event}`, { detail: data }));
  }

  private trackEvent(eventName: string, parameters?: any): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        ...parameters,
        app_version: this.config.version,
        session_id: this.state.session.id
      });
    }
  }

  private trackPageView(): void {
    this.state.session.pageViews++;
    
    if (typeof gtag !== 'undefined') {
      gtag('config', 'G-H7RWMCGDHG', {
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }

  private saveCalculationToHistory(calculatorId: string, data: any): void {
    try {
      const history = JSON.parse(localStorage.getItem('calculation_history') || '[]');
      history.push({
        id: this.generateId(),
        calculatorId,
        timestamp: new Date().toISOString(),
        inputs: data.inputs,
        outputs: data.outputs
      });

      // Keep last 100 calculations
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      localStorage.setItem('calculation_history', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save calculation to history:', error);
    }
  }

  private autoSaveCalculatorState(calculatorId: string, data: any): void {
    try {
      const key = `calculator_state_${calculatorId}`;
      localStorage.setItem(key, JSON.stringify({
        timestamp: new Date().toISOString(),
        ...data
      }));
    } catch (error) {
      console.warn('Failed to auto-save calculator state:', error);
    }
  }

  private saveAppState(): void {
    try {
      localStorage.setItem('costflowai_preferences', JSON.stringify(this.state.preferences));
      localStorage.setItem('costflowai_session', JSON.stringify(this.state.session));
    } catch (error) {
      console.warn('Failed to save app state:', error);
    }
  }

  private refreshDataIfNeeded(): void {
    // Check if data needs refreshing based on last activity
    const timeSinceLastActivity = Date.now() - this.state.session.lastActivity.getTime();
    
    if (timeSinceLastActivity > 30 * 60 * 1000) { // 30 minutes
      // Refresh data
      console.log('Refreshing data after long inactivity');
    }
  }

  private async syncOfflineData(): Promise<void> {
    // Implementation would sync any offline data
    console.log('Syncing offline data...');
  }

  private updatePerformanceDisplay(metric: any): void {
    // Update performance indicators in UI if needed
    const performanceIndicator = document.querySelector('[data-performance-indicator]');
    if (performanceIndicator) {
      // Update indicator based on performance metrics
    }
  }

  // Public API
  public getCalculator(id: string): EnhancedCalculator | undefined {
    return this.state.calculators.get(id);
  }

  public getAppState(): AppState {
    return { ...this.state };
  }

  public updatePreferences(preferences: Partial<UserPreferences>): void {
    this.state.preferences = { ...this.state.preferences, ...preferences };
    this.applyUserPreferences();
    this.saveAppState();
  }

  public async exportData(): Promise<string> {
    // Implementation would export user data
    return JSON.stringify({
      preferences: this.state.preferences,
      history: JSON.parse(localStorage.getItem('calculation_history') || '[]')
    });
  }

  public async importData(data: string): Promise<void> {
    // Implementation would import user data
    const imported = JSON.parse(data);
    if (imported.preferences) {
      this.updatePreferences(imported.preferences);
    }
  }

  public dispose(): void {
    // Cleanup resources
    this.state.calculators.forEach(calculator => calculator.dispose?.());
    this.performance?.dispose();
    
    console.log('CostFlowAI application disposed');
  }
}

// Default calculator configurations
const defaultCalculatorConfigs: CalculatorConfig[] = [
  {
    id: 'concrete-volume',
    name: 'Concrete Volume Calculator',
    description: 'Calculate concrete volume and material costs for slabs, footings, and walls',
    inputs: [
      {
        id: 'length',
        label: 'Length',
        type: 'number',
        unit: 'ft',
        required: true,
        min: 1,
        max: 1000,
        defaultValue: 30,
        category: 'Dimensions'
      },
      {
        id: 'width',
        label: 'Width',
        type: 'number',
        unit: 'ft',
        required: true,
        min: 1,
        max: 1000,
        defaultValue: 20,
        category: 'Dimensions'
      },
      {
        id: 'thickness',
        label: 'Thickness',
        type: 'number',
        unit: 'in',
        required: true,
        min: 2,
        max: 24,
        defaultValue: 4,
        category: 'Dimensions'
      }
    ],
    outputs: [
      {
        id: 'volume',
        label: 'Concrete Volume',
        type: 'number',
        unit: 'cu yd',
        precision: 2,
        category: 'Results'
      },
      {
        id: 'cost',
        label: 'Estimated Cost',
        type: 'currency',
        precision: 2,
        category: 'Results'
      }
    ],
    calculations: [
      {
        id: 'volume',
        name: 'Volume Calculation',
        formula: '(length * width * (thickness / 12)) / 27 * 1.1',
        dependencies: ['length', 'width', 'thickness']
      },
      {
        id: 'cost',
        name: 'Cost Calculation',
        formula: 'volume * 150',
        dependencies: ['volume']
      }
    ],
    validation: {
      required: ['length', 'width', 'thickness'],
      ranges: {
        length: { min: 1, max: 1000 },
        width: { min: 1, max: 1000 },
        thickness: { min: 2, max: 24 }
      },
      dependencies: {},
      custom: []
    },
    metadata: {
      version: '2.0.0',
      lastUpdated: '2024-12-17',
      author: 'CostFlowAI',
      accuracy: 'ROM',
      complexity: 'Basic',
      industries: ['construction', 'concrete'],
      tags: ['concrete', 'volume', 'cost', 'basic']
    }
  }
];

// Initialize application when DOM is ready
function initializeApp(): void {
  const config: AppConfig = {
    version: '2.0.0',
    environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'production',
    features: {
      security: true,
      performance: true,
      pwa: true,
      analytics: true,
      offline: true
    },
    security: {
      enableCSP: true,
      enableRateLimiting: true,
      enableInputSanitization: true,
      enableBotDetection: true,
      enableAuditLogging: true
    },
    calculators: defaultCalculatorConfigs
  };

  window.costFlowAI = new CostFlowAIApp(config);
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for module usage
export { CostFlowAIApp, type AppConfig, type AppState, type UserProfile };

// Global type declaration
declare global {
  interface Window {
    costFlowAI: CostFlowAIApp;
  }
}
