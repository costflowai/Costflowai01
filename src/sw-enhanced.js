/**
 * Enhanced Service Worker for CostFlowAI v2.0
 * Provides offline functionality, caching strategies, and performance optimization
 */

const CACHE_NAME = 'costflowai-v2.0.0';
const CACHE_VERSION = '2024-12-17';

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Core app shell - cache first with network fallback
  APP_SHELL: 'cache-first',
  // Static assets - cache first with stale-while-revalidate
  STATIC: 'stale-while-revalidate',
  // API calls - network first with cache fallback
  API: 'network-first',
  // Images - cache first with network fallback
  IMAGES: 'cache-first',
  // Dynamic content - network first
  DYNAMIC: 'network-first'
};

// Resources to cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/calculators/',
  '/calculators/index.html',
  '/assets/css/design-system.css',
  '/assets/css/main.css',
  '/assets/js/calculator-enhanced.js',
  '/assets/js/init.js',
  '/manifest.json',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/assets/images/favicon.svg'
];

// Resources to cache on first request
const RUNTIME_CACHE_PATTERNS = [
  { pattern: /\.(?:js|css)$/, strategy: CACHE_STRATEGIES.STATIC },
  { pattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/, strategy: CACHE_STRATEGIES.IMAGES },
  { pattern: /\/api\//, strategy: CACHE_STRATEGIES.API },
  { pattern: /\/calculators\/.*\.html$/, strategy: CACHE_STRATEGIES.DYNAMIC }
];

// Maximum cache sizes
const CACHE_LIMITS = {
  [CACHE_STRATEGIES.STATIC]: 50,
  [CACHE_STRATEGIES.IMAGES]: 30,
  [CACHE_STRATEGIES.API]: 20,
  [CACHE_STRATEGIES.DYNAMIC]: 25
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  [CACHE_STRATEGIES.STATIC]: 7 * 24 * 60 * 60 * 1000, // 7 days
  [CACHE_STRATEGIES.IMAGES]: 30 * 24 * 60 * 60 * 1000, // 30 days
  [CACHE_STRATEGIES.API]: 5 * 60 * 1000, // 5 minutes
  [CACHE_STRATEGIES.DYNAMIC]: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Service Worker Event Handlers
 */

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      cachesCoreAssets(),
      self.skipWaiting() // Force activation of new service worker
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      cleanupOldCaches(),
      self.clients.claim() // Take control of all pages
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const strategy = determineStrategy(event.request);
  
  event.respondWith(
    handleRequest(event.request, strategy)
      .catch(error => {
        console.error('Fetch handler error:', error);
        return handleOfflineFallback(event.request);
      })
  );
});

// Message event - handle communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type) {
    handleMessage(event.data, event.ports[0]);
  }
});

// Background sync event - handle offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Push event - handle push notifications
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(handlePushNotification(data));
  }
});

/**
 * Core Functions
 */

async function cachesCoreAssets() {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Cache core assets with error handling
    const cachePromises = CORE_ASSETS.map(async url => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log(`✅ Cached: ${url}`);
        } else {
          console.warn(`⚠️ Failed to cache: ${url} (${response.status})`);
        }
      } catch (error) {
        console.error(`❌ Error caching ${url}:`, error);
      }
    });
    
    await Promise.all(cachePromises);
    console.log('🎉 Core assets cached successfully');
    
  } catch (error) {
    console.error('❌ Failed to cache core assets:', error);
    throw error;
  }
}

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('costflowai-') && name !== CACHE_NAME
    );
    
    if (oldCaches.length > 0) {
      await Promise.all(oldCaches.map(name => caches.delete(name)));
      console.log(`🗑️ Cleaned up ${oldCaches.length} old caches`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up old caches:', error);
  }
}

function determineStrategy(request) {
  const url = new URL(request.url);
  
  // Check runtime cache patterns
  for (const { pattern, strategy } of RUNTIME_CACHE_PATTERNS) {
    if (pattern.test(url.pathname)) {
      return strategy;
    }
  }
  
  // Default strategies based on request type
  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    return CACHE_STRATEGIES.APP_SHELL;
  }
  
  if (url.pathname.includes('/api/')) {
    return CACHE_STRATEGIES.API;
  }
  
  return CACHE_STRATEGIES.DYNAMIC;
}

async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);
    
    default:
      return networkFirst(request);
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await updateCache(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      console.log('📱 Serving stale cache due to network error');
      return cachedResponse;
    }
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await updateCache(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('📱 Serving cached response due to network error');
      return cachedResponse;
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  // Start network request immediately
  const networkPromise = fetch(request).then(async response => {
    if (response.ok) {
      await updateCache(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('Background fetch failed:', error);
    return null;
  });
  
  // Return cached response immediately if available
  if (cachedResponse && !isExpired(cachedResponse)) {
    // Don't await the network request
    networkPromise;
    return cachedResponse;
  }
  
  // Wait for network if no cache or cache is expired
  return networkPromise || cachedResponse;
}

async function updateCache(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    // Add timestamp header for expiration tracking
    const responseToCache = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'sw-cached-date': new Date().toISOString()
      }
    });
    
    await cache.put(request, responseToCache);
    
    // Enforce cache limits
    await enforceCacheLimit(cache, request);
    
  } catch (error) {
    console.error('Error updating cache:', error);
  }
}

function isExpired(response) {
  const cachedDate = response.headers.get('sw-cached-date');
  
  if (!cachedDate) {
    return false; // No timestamp, consider it valid
  }
  
  const cacheTime = new Date(cachedDate).getTime();
  const now = Date.now();
  const strategy = determineStrategy({ url: response.url });
  const maxAge = CACHE_EXPIRATION[strategy] || CACHE_EXPIRATION[CACHE_STRATEGIES.DYNAMIC];
  
  return (now - cacheTime) > maxAge;
}

async function enforceCacheLimit(cache, request) {
  const strategy = determineStrategy(request);
  const limit = CACHE_LIMITS[strategy];
  
  if (!limit) return;
  
  try {
    const keys = await cache.keys();
    const relevantKeys = keys.filter(key => {
      return determineStrategy(key) === strategy;
    });
    
    if (relevantKeys.length > limit) {
      // Sort by cache date (oldest first)
      relevantKeys.sort((a, b) => {
        const aDate = a.headers?.get('sw-cached-date') || '1970-01-01';
        const bDate = b.headers?.get('sw-cached-date') || '1970-01-01';
        return new Date(aDate) - new Date(bDate);
      });
      
      // Remove oldest entries
      const toDelete = relevantKeys.slice(0, relevantKeys.length - limit);
      await Promise.all(toDelete.map(key => cache.delete(key)));
      
      console.log(`🗑️ Removed ${toDelete.length} old cache entries for ${strategy}`);
    }
  } catch (error) {
    console.error('Error enforcing cache limit:', error);
  }
}

async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Create basic offline response if no offline page cached
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>CostFlowAI - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 2rem; }
            .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
            .offline-message { color: #666; margin-bottom: 2rem; }
            .retry-btn { background: #007bff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="offline-icon">📱</div>
          <h1>You're Offline</h1>
          <p class="offline-message">Please check your internet connection and try again.</p>
          <button class="retry-btn" onclick="window.location.reload()">Retry</button>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Return placeholder for images
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="#9ca3af">Image Unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  // Generic network error
  return new Response('Network Error', {
    status: 408,
    headers: { 'Content-Type': 'text/plain' }
  });
}

async function handleMessage(data, port) {
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      port.postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      await caches.delete(CACHE_NAME);
      port.postMessage({ success: true });
      break;
      
    case 'GET_CACHE_SIZE':
      const size = await getCacheSize();
      port.postMessage({ size });
      break;
      
    case 'PREFETCH_RESOURCES':
      await prefetchResources(data.urls);
      port.postMessage({ success: true });
      break;
      
    default:
      console.warn('Unknown message type:', data.type);
  }
}

async function getCacheSize() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    let totalSize = 0;
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
    
    return {
      entries: keys.length,
      size: totalSize,
      sizeFormatted: formatBytes(totalSize)
    };
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return { entries: 0, size: 0, sizeFormatted: '0 B' };
  }
}

async function prefetchResources(urls) {
  const cache = await caches.open(CACHE_NAME);
  
  const prefetchPromises = urls.map(async url => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.warn(`Failed to prefetch ${url}:`, error);
    }
  });
  
  await Promise.all(prefetchPromises);
}

async function handleBackgroundSync() {
  console.log('🔄 Handling background sync...');
  
  // Handle any queued offline actions
  try {
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      await processOfflineAction(action);
    }
    
    await clearOfflineActions();
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

async function handlePushNotification(data) {
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/icon-192.png',
    vibrate: [100, 50, 100],
    data: data,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/assets/images/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/images/icon-192.png'
      }
    ]
  };
  
  await self.registration.showNotification(data.title || 'CostFlowAI', options);
}

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

/**
 * Utility Functions
 */

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function getOfflineActions() {
  // Implementation would retrieve queued actions from IndexedDB
  return [];
}

async function processOfflineAction(action) {
  // Implementation would process queued offline actions
  console.log('Processing offline action:', action);
}

async function clearOfflineActions() {
  // Implementation would clear processed actions from IndexedDB
  console.log('Clearing offline actions');
}

// Performance monitoring
self.addEventListener('install', () => {
  console.log('📊 Service Worker Performance Metrics:');
  console.log(`Cache Name: ${CACHE_NAME}`);
  console.log(`Cache Version: ${CACHE_VERSION}`);
  console.log(`Core Assets: ${CORE_ASSETS.length} files`);
});

console.log('🚀 CostFlowAI Service Worker v2.0 loaded successfully');
