/**
 * Service Worker Registration
 * Handles PWA service worker registration and updates
 */

class ServiceWorkerManager {
    constructor() {
        this.swRegistration = null;
        this.isOnline = navigator.onLine;
        this.initServiceWorker();
        this.initOnlineDetection();
    }

    /**
     * Initialize service worker registration
     */
    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                console.log('SW Manager: Registering service worker...');

                this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('SW Manager: Service worker registered successfully');

                // Handle updates
                this.swRegistration.addEventListener('updatefound', () => {
                    this.handleServiceWorkerUpdate();
                });

                // Check for updates every 30 minutes
                setInterval(() => {
                    this.checkForUpdates();
                }, 30 * 60 * 1000);

                // Initial update check
                this.checkForUpdates();

            } catch (error) {
                console.error('SW Manager: Service worker registration failed:', error);
            }
        } else {
            console.log('SW Manager: Service workers not supported');
        }
    }

    /**
     * Handle service worker updates
     */
    handleServiceWorkerUpdate() {
        const newWorker = this.swRegistration.installing;

        console.log('SW Manager: New service worker available');

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('SW Manager: New service worker installed, showing update prompt');
                this.showUpdatePrompt();
            }
        });
    }

    /**
     * Check for service worker updates
     */
    async checkForUpdates() {
        if (this.swRegistration) {
            try {
                await this.swRegistration.update();
                console.log('SW Manager: Checked for updates');
            } catch (error) {
                console.error('SW Manager: Update check failed:', error);
            }
        }
    }

    /**
     * Show update prompt to user
     */
    showUpdatePrompt() {
        const updateBar = document.createElement('div');
        updateBar.id = 'sw-update-bar';
        updateBar.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #2563eb;
                color: white;
                padding: 12px 20px;
                text-align: center;
                z-index: 10001;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                font-size: 14px;
            ">
                <span>A new version is available!</span>
                <button id="sw-update-btn" style="
                    margin-left: 15px;
                    background: white;
                    color: #2563eb;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 500;
                ">Update Now</button>
                <button id="sw-dismiss-btn" style="
                    margin-left: 8px;
                    background: transparent;
                    color: white;
                    border: 1px solid white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                ">Later</button>
            </div>
        `;\n\n        document.body.appendChild(updateBar);\n\n        // Handle update button\n        document.getElementById('sw-update-btn').addEventListener('click', () => {\n            this.applyUpdate();\n        });\n\n        // Handle dismiss button\n        document.getElementById('sw-dismiss-btn').addEventListener('click', () => {\n            document.body.removeChild(updateBar);\n        });\n\n        // Auto-dismiss after 30 seconds\n        setTimeout(() => {\n            if (document.getElementById('sw-update-bar')) {\n                document.body.removeChild(updateBar);\n            }\n        }, 30000);\n    }\n\n    /**\n     * Apply service worker update\n     */\n    async applyUpdate() {\n        const newWorker = this.swRegistration.installing || this.swRegistration.waiting;\n        \n        if (newWorker) {\n            newWorker.postMessage({ type: 'SKIP_WAITING' });\n            \n            // Wait for the new service worker to be active\n            newWorker.addEventListener('statechange', () => {\n                if (newWorker.state === 'activated') {\n                    console.log('SW Manager: New service worker activated, reloading page');\n                    window.location.reload();\n                }\n            });\n        }\n    }\n\n    /**\n     * Initialize online/offline detection\n     */\n    initOnlineDetection() {\n        window.addEventListener('online', () => {\n            this.isOnline = true;\n            this.showConnectionStatus('back online', 'success');\n            console.log('SW Manager: Back online');\n        });\n\n        window.addEventListener('offline', () => {\n            this.isOnline = false;\n            this.showConnectionStatus('offline - using cached version', 'warning');\n            console.log('SW Manager: Gone offline');\n        });\n    }\n\n    /**\n     * Show connection status message\n     * @param {string} message - Status message\n     * @param {string} type - Message type ('success', 'warning', 'error')\n     */\n    showConnectionStatus(message, type) {\n        const statusEl = document.createElement('div');\n        statusEl.style.cssText = `\n            position: fixed;\n            bottom: 20px;\n            left: 50%;\n            transform: translateX(-50%);\n            padding: 12px 20px;\n            border-radius: 25px;\n            font-size: 14px;\n            font-weight: 500;\n            z-index: 10000;\n            transition: opacity 0.3s ease;\n            box-shadow: 0 2px 8px rgba(0,0,0,0.15);\n        `;\n\n        if (type === 'success') {\n            statusEl.style.background = '#d4edda';\n            statusEl.style.color = '#155724';\n            statusEl.style.border = '1px solid #c3e6cb';\n        } else if (type === 'warning') {\n            statusEl.style.background = '#fff3cd';\n            statusEl.style.color = '#856404';\n            statusEl.style.border = '1px solid #ffeaa7';\n        } else {\n            statusEl.style.background = '#f8d7da';\n            statusEl.style.color = '#721c24';\n            statusEl.style.border = '1px solid #f5c6cb';\n        }\n\n        statusEl.textContent = `📶 You're ${message}`;\n        document.body.appendChild(statusEl);\n\n        // Fade out after 3 seconds\n        setTimeout(() => {\n            statusEl.style.opacity = '0';\n            setTimeout(() => {\n                if (statusEl.parentNode) {\n                    statusEl.parentNode.removeChild(statusEl);\n                }\n            }, 300);\n        }, 3000);\n    }\n\n    /**\n     * Get cache information\n     * @returns {Promise<Object>} Cache info\n     */\n    async getCacheInfo() {\n        if (!this.swRegistration || !this.swRegistration.active) {\n            return null;\n        }\n\n        return new Promise((resolve) => {\n            const messageChannel = new MessageChannel();\n            \n            messageChannel.port1.onmessage = (event) => {\n                resolve(event.data);\n            };\n\n            this.swRegistration.active.postMessage(\n                { type: 'GET_CACHE_SIZE' },\n                [messageChannel.port2]\n            );\n        });\n    }\n\n    /**\n     * Check if app is installed as PWA\n     * @returns {boolean} True if installed\n     */\n    isInstalled() {\n        return window.matchMedia('(display-mode: standalone)').matches || \n               window.navigator.standalone === true;\n    }\n\n    /**\n     * Get installation status\n     * @returns {Object} Installation info\n     */\n    getInstallationStatus() {\n        return {\n            isInstalled: this.isInstalled(),\n            isOnline: this.isOnline,\n            hasServiceWorker: !!this.swRegistration,\n            serviceWorkerState: this.swRegistration ? this.swRegistration.active?.state : null\n        };\n    }\n}\n\n// Initialize service worker manager\nconst swManager = new ServiceWorkerManager();\n\n// Export for global use\nwindow.swManager = swManager;\n\n// Add install prompt handling\nlet deferredPrompt;\n\nwindow.addEventListener('beforeinstallprompt', (e) => {\n    console.log('SW Manager: Install prompt available');\n    e.preventDefault();\n    deferredPrompt = e;\n    \n    // Show custom install button or banner\n    showInstallPrompt();\n});\n\n/**\n * Show install prompt\n */\nfunction showInstallPrompt() {\n    // Only show if not already installed\n    if (swManager.isInstalled()) {\n        return;\n    }\n\n    const installBanner = document.createElement('div');\n    installBanner.id = 'install-banner';\n    installBanner.innerHTML = `\n        <div style=\"\n            position: fixed;\n            bottom: 20px;\n            left: 20px;\n            right: 20px;\n            background: white;\n            border: 1px solid #e5e7eb;\n            border-radius: 8px;\n            padding: 16px;\n            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n            z-index: 10000;\n            display: flex;\n            align-items: center;\n            justify-content: space-between;\n            max-width: 400px;\n            margin: 0 auto;\n        \">\n            <div style=\"flex: 1;\">\n                <div style=\"font-weight: 600; color: #111827;\">📱 Install CFA Calculator</div>\n                <div style=\"font-size: 14px; color: #6b7280; margin-top: 4px;\">Add to home screen for quick access</div>\n            </div>\n            <div>\n                <button id=\"install-btn\" style=\"\n                    background: #2563eb;\n                    color: white;\n                    border: none;\n                    padding: 8px 16px;\n                    border-radius: 4px;\n                    font-weight: 500;\n                    cursor: pointer;\n                    margin-right: 8px;\n                \">Install</button>\n                <button id=\"install-dismiss\" style=\"\n                    background: transparent;\n                    color: #6b7280;\n                    border: none;\n                    padding: 8px;\n                    cursor: pointer;\n                \">×</button>\n            </div>\n        </div>\n    `;\n\n    document.body.appendChild(installBanner);\n\n    // Handle install button\n    document.getElementById('install-btn').addEventListener('click', async () => {\n        if (deferredPrompt) {\n            deferredPrompt.prompt();\n            const { outcome } = await deferredPrompt.userChoice;\n            console.log('SW Manager: Install prompt result:', outcome);\n            deferredPrompt = null;\n        }\n        document.body.removeChild(installBanner);\n    });\n\n    // Handle dismiss button\n    document.getElementById('install-dismiss').addEventListener('click', () => {\n        document.body.removeChild(installBanner);\n        // Don't show again for this session\n        sessionStorage.setItem('install-prompt-dismissed', 'true');\n    });\n\n    // Auto-dismiss after 10 seconds\n    setTimeout(() => {\n        if (document.getElementById('install-banner')) {\n            document.body.removeChild(installBanner);\n        }\n    }, 10000);\n}