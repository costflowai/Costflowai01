/**
 * Service Worker Registration
 */

(function() {
    'use strict';
    
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
        // Register after page load
        window.addEventListener('load', () => {
            registerServiceWorker();
        });
    }
    
    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('[SW] Service worker registered:', registration);
            
            // Check if page is controlled by service worker
            if (navigator.serviceWorker.controller) {
                console.log('[SW] Page is controlled by service worker');
            }
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[SW] New service worker installing');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        showUpdateNotification();
                    }
                });
            });
            
        } catch (error) {
            console.error('[SW] Service worker registration failed:', error);
        }
    }
    
    function showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'sw-update-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #FF6B35;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <span>New version available!</span>
                <button onclick="window.location.reload()" style="
                    background: white;
                    color: #FF6B35;
                    border: none;
                    padding: 5px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">Update</button>
            </div>
        `;
        document.body.appendChild(notification);
    }
    
})();
