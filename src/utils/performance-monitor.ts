/**
 * Advanced Performance Monitoring System v2.0
 * Real-time performance tracking, optimization, and reporting
 */

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom Metrics
  calculationTime?: number;
  renderTime?: number;
  memoryUsage?: number;
  bundleSize?: number;
  resourceCount?: number;
  
  // User Experience
  userInteractions?: number;
  errorCount?: number;
  sessionDuration?: number;
  pageViews?: number;
}

interface PerformanceThresholds {
  lcp: { good: number; needs_improvement: number };
  fid: { good: number; needs_improvement: number };
  cls: { good: number; needs_improvement: number };
  fcp: { good: number; needs_improvement: number };
  ttfb: { good: number; needs_improvement: number };
  calculationTime: { good: number; needs_improvement: number };
  memoryUsage: { good: number; needs_improvement: number };
}

interface PerformanceAlert {
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  suggestions: string[];
}

interface ResourceTiming {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
  blocked?: boolean;
  cached?: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private alerts: PerformanceAlert[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private startTime: number = performance.now();
  private sessionId: string;
  private isMonitoring: boolean = false;

  private thresholds: PerformanceThresholds = {
    lcp: { good: 2500, needs_improvement: 4000 },
    fid: { good: 100, needs_improvement: 300 },
    cls: { good: 0.1, needs_improvement: 0.25 },
    fcp: { good: 1800, needs_improvement: 3000 },
    ttfb: { good: 800, needs_improvement: 1800 },
    calculationTime: { good: 100, needs_improvement: 500 },
    memoryUsage: { good: 50 * 1024 * 1024, needs_improvement: 100 * 1024 * 1024 }
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    this.setupWebVitalsMonitoring();
    this.setupResourceMonitoring();
    this.setupMemoryMonitoring();
    this.setupUserInteractionMonitoring();
    this.setupErrorMonitoring();
    this.setupCustomMetrics();

    // Start monitoring after page load
    if (document.readyState === 'complete') {
      this.startMonitoring();
    } else {
      window.addEventListener('load', () => this.startMonitoring());
    }

    console.log('📊 Performance Monitor v2.0 initialized');
  }

  private startMonitoring(): void {
    this.isMonitoring = true;
    
    // Initial metrics collection
    this.collectInitialMetrics();
    
    // Periodic monitoring
    setInterval(() => this.collectPeriodicMetrics(), 30000); // Every 30 seconds
    
    // Report metrics periodically
    setInterval(() => this.reportMetrics(), 60000); // Every minute
    
    // Cleanup old data
    setInterval(() => this.cleanup(), 300000); // Every 5 minutes
  }

  private setupWebVitalsMonitoring(): void {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            renderTime?: number;
            loadTime?: number;
          };
          
          const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
          this.updateMetric('lcp', lcp);
          this.checkThreshold('lcp', lcp);
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            this.updateMetric('fid', fid);
            this.checkThreshold('fid', fid);
          });
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          this.updateMetric('cls', clsValue);
          this.checkThreshold('cls', clsValue);
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }

      // First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.updateMetric('fcp', entry.startTime);
              this.checkThreshold('fcp', entry.startTime);
            }
          });
        });
        
        fcpObserver.observe({ type: 'paint', buffered: true });
        this.observers.set('fcp', fcpObserver);
      } catch (error) {
        console.warn('FCP observer not supported:', error);
      }
    }
  }

  private setupResourceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.processResourceEntries(entries as PerformanceResourceTiming[]);
        });
        
        resourceObserver.observe({ type: 'resource', buffered: true });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.updateMetric('ttfb', navigation.responseStart - navigation.requestStart);
      this.checkThreshold('ttfb', navigation.responseStart - navigation.requestStart);
    }
  }

  private processResourceEntries(entries: PerformanceResourceTiming[]): void {
    let totalSize = 0;
    let blockedResources = 0;
    let cachedResources = 0;

    entries.forEach((entry) => {
      const resource: ResourceTiming = {
        name: entry.name,
        type: this.getResourceType(entry.name),
        size: entry.transferSize || 0,
        duration: entry.responseEnd - entry.requestStart,
        startTime: entry.startTime,
        blocked: entry.responseEnd - entry.requestStart > 3000,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0
      };

      totalSize += resource.size;
      
      if (resource.blocked) blockedResources++;
      if (resource.cached) cachedResources++;

      // Alert for slow resources
      if (resource.duration > 2000) {
        this.createAlert('slow_resource', resource.duration, 2000, 'warning', [
          `Resource ${resource.name} took ${resource.duration.toFixed(2)}ms to load`,
          'Consider optimizing this resource or using a CDN',
          'Check if the resource can be cached or compressed'
        ]);
      }
    });

    this.updateMetric('bundleSize', totalSize);
    this.updateMetric('resourceCount', entries.length);

    // Performance insights
    const cacheHitRate = entries.length > 0 ? (cachedResources / entries.length) * 100 : 0;
    
    if (cacheHitRate < 30) {
      this.createAlert('low_cache_hit_rate', cacheHitRate, 30, 'info', [
        'Low cache hit rate detected',
        'Consider implementing better caching strategies',
        'Review cache headers and service worker implementation'
      ]);
    }
  }

  private getResourceType(url: string): string {
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.css$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.updateMetric('memoryUsage', memory.usedJSHeapSize);
        this.checkThreshold('memoryUsage', memory.usedJSHeapSize);
        
        // Memory leak detection
        const memoryGrowthRate = this.calculateMemoryGrowthRate();
        if (memoryGrowthRate > 1024 * 1024) { // 1MB per minute
          this.createAlert('memory_leak', memoryGrowthRate, 1024 * 1024, 'warning', [
            'Potential memory leak detected',
            'Memory usage is growing rapidly',
            'Check for event listeners, timers, or large object retention'
          ]);
        }
      }, 10000); // Every 10 seconds
    }
  }

  private setupUserInteractionMonitoring(): void {
    let interactionCount = 0;
    
    ['click', 'keydown', 'touchstart', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        interactionCount++;
        this.updateMetric('userInteractions', interactionCount);
      }, { passive: true });
    });

    // Track long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) {
              this.createAlert('long_task', entry.duration, 50, 'warning', [
                `Long task detected: ${entry.duration.toFixed(2)}ms`,
                'Consider breaking up large JavaScript operations',
                'Use requestIdleCallback or web workers for heavy computations'
              ]);
            }
          });
        });
        
        longTaskObserver.observe({ type: 'longtask', buffered: true });
        this.observers.set('longtask', longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  private setupErrorMonitoring(): void {
    let errorCount = 0;

    window.addEventListener('error', (event) => {
      errorCount++;
      this.updateMetric('errorCount', errorCount);
      
      this.createAlert('javascript_error', 1, 0, 'critical', [
        `JavaScript error: ${event.message}`,
        `File: ${event.filename}:${event.lineno}:${event.colno}`,
        'Check console for full stack trace'
      ]);
    });

    window.addEventListener('unhandledrejection', (event) => {
      errorCount++;
      this.updateMetric('errorCount', errorCount);
      
      this.createAlert('unhandled_promise', 1, 0, 'critical', [
        `Unhandled promise rejection: ${event.reason}`,
        'Check for missing catch blocks in async operations'
      ]);
    });
  }

  private setupCustomMetrics(): void {
    // Monitor calculator performance
    document.addEventListener('calculationStart', () => {
      this.metrics.calculationStartTime = performance.now();
    });

    document.addEventListener('calculationComplete', (event: any) => {
      if (this.metrics.calculationStartTime) {
        const calculationTime = performance.now() - this.metrics.calculationStartTime;
        this.updateMetric('calculationTime', calculationTime);
        this.checkThreshold('calculationTime', calculationTime);
        delete this.metrics.calculationStartTime;
      }
    });

    // Track page views
    let pageViews = 1;
    this.updateMetric('pageViews', pageViews);

    // Track session duration
    setInterval(() => {
      const sessionDuration = performance.now() - this.startTime;
      this.updateMetric('sessionDuration', sessionDuration);
    }, 30000);
  }

  private collectInitialMetrics(): void {
    // Collect navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.updateMetric('ttfb', navigation.responseStart - navigation.requestStart);
      this.updateMetric('renderTime', navigation.loadEventEnd - navigation.loadEventStart);
    }

    // Collect paint timing
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        this.updateMetric('fcp', entry.startTime);
      }
    });
  }

  private collectPeriodicMetrics(): void {
    // Update memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.updateMetric('memoryUsage', memory.usedJSHeapSize);
    }

    // Update session duration
    const sessionDuration = performance.now() - this.startTime;
    this.updateMetric('sessionDuration', sessionDuration);
  }

  private updateMetric(name: keyof PerformanceMetrics, value: number): void {
    this.metrics[name] = value;
    
    // Emit custom event for real-time monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performanceMetricUpdate', {
        detail: { metric: name, value, timestamp: Date.now() }
      }));
    }
  }

  private checkThreshold(metric: keyof PerformanceThresholds, value: number): void {
    const threshold = this.thresholds[metric];
    if (!threshold) return;

    let severity: 'info' | 'warning' | 'critical' = 'info';
    let suggestions: string[] = [];

    if (value > threshold.needs_improvement) {
      severity = 'critical';
      suggestions = this.getOptimizationSuggestions(metric, 'critical');
    } else if (value > threshold.good) {
      severity = 'warning';
      suggestions = this.getOptimizationSuggestions(metric, 'warning');
    }

    if (severity !== 'info') {
      this.createAlert(metric, value, threshold.good, severity, suggestions);
    }
  }

  private getOptimizationSuggestions(metric: string, severity: string): string[] {
    const suggestions: { [key: string]: { [key: string]: string[] } } = {
      lcp: {
        warning: [
          'Optimize images and use WebP format',
          'Implement lazy loading for below-fold content',
          'Use a CDN for faster content delivery'
        ],
        critical: [
          'Critical LCP issue detected',
          'Remove render-blocking resources',
          'Optimize server response times',
          'Consider preloading important resources'
        ]
      },
      fid: {
        warning: [
          'Reduce JavaScript execution time',
          'Break up long tasks',
          'Use web workers for heavy computations'
        ],
        critical: [
          'Critical input delay detected',
          'Defer non-essential JavaScript',
          'Optimize third-party scripts',
          'Consider code splitting'
        ]
      },
      cls: {
        warning: [
          'Set size attributes on images and videos',
          'Reserve space for dynamic content',
          'Avoid inserting content above existing content'
        ],
        critical: [
          'Critical layout shift detected',
          'Review dynamic content insertion',
          'Use CSS containment',
          'Preload fonts to prevent FOIT/FOUT'
        ]
      },
      calculationTime: {
        warning: [
          'Optimize calculation algorithms',
          'Consider caching complex calculations',
          'Use requestIdleCallback for non-urgent calculations'
        ],
        critical: [
          'Calculator performance is poor',
          'Consider moving calculations to web workers',
          'Implement progressive calculation updates',
          'Review algorithm complexity'
        ]
      },
      memoryUsage: {
        warning: [
          'Monitor for memory leaks',
          'Clean up event listeners',
          'Optimize data structures'
        ],
        critical: [
          'High memory usage detected',
          'Check for memory leaks',
          'Consider lazy loading of data',
          'Review object retention'
        ]
      }
    };

    return suggestions[metric]?.[severity] || ['Review performance optimization opportunities'];
  }

  private createAlert(metric: string, value: number, threshold: number, severity: 'info' | 'warning' | 'critical', suggestions: string[]): void {
    const alert: PerformanceAlert = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      threshold,
      severity,
      suggestions
    };

    this.alerts.push(alert);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const color = severity === 'critical' ? 'color: red' : severity === 'warning' ? 'color: orange' : 'color: blue';
      console.warn(`%c📊 Performance Alert [${severity.toUpperCase()}]: ${metric}`, color, alert);
    }

    // Emit event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performanceAlert', { detail: alert }));
    }

    // Report critical alerts immediately
    if (severity === 'critical') {
      this.reportCriticalAlert(alert);
    }
  }

  private async reportCriticalAlert(alert: PerformanceAlert): Promise<void> {
    try {
      // In a real implementation, this would send to monitoring service
      await fetch('/api/performance/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alert,
          sessionId: this.sessionId,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.error('Failed to report performance alert:', error);
    }
  }

  private calculateMemoryGrowthRate(): number {
    // Implementation would track memory usage over time
    // and calculate growth rate
    return 0;
  }

  private async reportMetrics(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      const report = {
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        alerts: this.alerts.slice(-10), // Last 10 alerts
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt
        } : null
      };

      // Send to analytics service
      await fetch('/api/performance/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });

      // Also send to Google Analytics if available
      if (typeof gtag !== 'undefined') {
        Object.entries(this.metrics).forEach(([metric, value]) => {
          if (typeof value === 'number') {
            gtag('event', 'performance_metric', {
              metric_name: metric,
              value: Math.round(value),
              session_id: this.sessionId
            });
          }
        });
      }

    } catch (error) {
      console.error('Failed to report performance metrics:', error);
    }
  }

  private cleanup(): void {
    // Remove old alerts (keep last 50)
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public API
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getPerformanceScore(): number {
    const scores = {
      lcp: this.calculateScore('lcp', this.metrics.lcp || 0),
      fid: this.calculateScore('fid', this.metrics.fid || 0),
      cls: this.calculateScore('cls', this.metrics.cls || 0),
      fcp: this.calculateScore('fcp', this.metrics.fcp || 0),
      ttfb: this.calculateScore('ttfb', this.metrics.ttfb || 0)
    };

    const validScores = Object.values(scores).filter(score => score > 0);
    return validScores.length > 0 ? validScores.reduce((a, b) => a + b) / validScores.length : 0;
  }

  private calculateScore(metric: keyof PerformanceThresholds, value: number): number {
    const threshold = this.thresholds[metric];
    if (!threshold || value === 0) return 0;

    if (value <= threshold.good) return 100;
    if (value <= threshold.needs_improvement) {
      return 100 - ((value - threshold.good) / (threshold.needs_improvement - threshold.good)) * 50;
    }
    return Math.max(0, 50 - ((value - threshold.needs_improvement) / threshold.needs_improvement) * 50);
  }

  public startProfiling(): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark('profiling-start');
    }
  }

  public endProfiling(label: string): number {
    if ('performance' in window && 'mark' in performance && 'measure' in performance) {
      performance.mark('profiling-end');
      performance.measure(label, 'profiling-start', 'profiling-end');
      
      const measures = performance.getEntriesByName(label, 'measure');
      return measures.length > 0 ? measures[measures.length - 1].duration : 0;
    }
    return 0;
  }

  public dispose(): void {
    this.isMonitoring = false;
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

export function initializePerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }
  return performanceMonitorInstance;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitorInstance;
}

export { PerformanceMonitor, type PerformanceMetrics, type PerformanceAlert };
