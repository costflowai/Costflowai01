/**
 * Site Initialization Script
 * Moved from inline scripts for CSP compliance
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize any common functionality
    initCommonHandlers();
    
    // Initialize page-specific functionality based on page type
    const page = document.body.dataset.page || getPageType();
    
    switch(page) {
        case 'index':
            initIndexPage();
            break;
        case 'admin-feedback':
            initFeedbackDashboard();
            break;
        case 'ai-photo':
            initPhotoEstimator();
            break;
        case 'api-docs':
            initApiDocs();
            break;
        case 'calculators':
            // Calculator initialization is handled by calculators-hub.js
            break;
        default:
            // Common page initialization
            break;
    }
});

function getPageType() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'index';
    if (path.includes('/admin/feedback')) return 'admin-feedback';
    if (path.includes('/ai-photo-estimator')) return 'ai-photo';
    if (path.includes('/api-docs')) return 'api-docs';
    if (path.includes('/calculators')) return 'calculators';
    return 'default';
}

function initCommonHandlers() {
    // Print button handler (common across pages)
    const printBtn = document.getElementById('btn-print');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
}

// Index page specific functions
function initIndexPage() {
    // Mobile menu toggle
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action="toggle-mobile-menu"]')) {
            toggleMobileMenu();
        } else if (e.target.matches('[data-action="show-feedback-alert"]')) {
            alert('Feedback system loaded! Please report issues to support@costflowai.com');
        }
    });
    
    // Handle CSS preload fallback (replacing onload attribute)
    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="style"]');
    preloadLinks.forEach(link => {
        link.addEventListener('load', function() {
            this.onload = null;
            this.rel = 'stylesheet';
        });
    });
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
    
    if (toggleBtn) {
        toggleBtn.classList.toggle('active');
        toggleBtn.textContent = navMenu && navMenu.classList.contains('active') ? '✕' : '☰';
    }
}

// Admin Feedback Dashboard Functions
function initFeedbackDashboard() {
    // Move inline handlers to delegated listeners
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action="refresh"]')) {
            loadFeedback();
        } else if (e.target.matches('[data-action="export"]')) {
            exportFeedback();
        } else if (e.target.matches('[data-action="clear-storage"]')) {
            clearLocalStorage();
        }
    });
    
    // Filter change handler
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterFeedback);
    }
}

// Photo Estimator Functions
function initPhotoEstimator() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action="download"]')) {
            downloadEstimate();
        } else if (e.target.matches('[data-action="reset"]')) {
            resetEstimator();
        }
    });
}

// API Docs Functions  
function initApiDocs() {
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action="signup"]')) {
            const plan = e.target.dataset.plan;
            signUpAPI(plan);
        } else if (e.target.matches('[data-action="contact-enterprise"]')) {
            contactEnterprise();
        }
    });
}

// Placeholder functions - these will be defined by the specific page scripts if needed
window.loadFeedback = window.loadFeedback || function() { console.warn('loadFeedback not implemented'); };
window.exportFeedback = window.exportFeedback || function() { console.warn('exportFeedback not implemented'); };
window.clearLocalStorage = window.clearLocalStorage || function() { console.warn('clearLocalStorage not implemented'); };
window.filterFeedback = window.filterFeedback || function() { console.warn('filterFeedback not implemented'); };
window.downloadEstimate = window.downloadEstimate || function() { console.warn('downloadEstimate not implemented'); };
window.resetEstimator = window.resetEstimator || function() { console.warn('resetEstimator not implemented'); };
window.signUpAPI = window.signUpAPI || function(plan) { console.warn('signUpAPI not implemented for plan:', plan); };
window.contactEnterprise = window.contactEnterprise || function() { console.warn('contactEnterprise not implemented'); };