/**
 * Secure DOM Manipulation Utility
 * Replaces dangerous innerHTML usage with safe DOM methods
 * @version 1.0.0
 */

class SecureDOMUtils {
    
    /**
     * Safely set text content (replaces innerHTML for text-only)
     * @param {Element|string} element - Target element or selector
     * @param {string} text - Text content to set
     */
    static setText(element, text) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.textContent = String(text || '');
        }
    }
    
    /**
     * Safely create and append HTML content
     * @param {Element|string} parent - Parent element or selector
     * @param {string} tagName - HTML tag name
     * @param {Object} attributes - Attributes to set
     * @param {string} textContent - Text content for the element
     * @returns {Element} Created element
     */
    static createElement(parent, tagName, attributes = {}, textContent = '') {
        const parentEl = typeof parent === 'string' ? document.querySelector(parent) : parent;
        if (!parentEl) return null;
        
        const element = document.createElement(tagName);
        
        // Set attributes safely
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = this.sanitizeString(value);
            } else if (key === 'style') {
                // Handle style object
                if (typeof value === 'object') {
                    Object.entries(value).forEach(([prop, val]) => {
                        element.style[prop] = this.sanitizeString(val);
                    });
                } else {
                    element.style.cssText = this.sanitizeString(value);
                }
            } else {
                element.setAttribute(key, this.sanitizeString(value));
            }
        });
        
        // Set text content safely
        if (textContent) {
            element.textContent = this.sanitizeString(textContent);
        }
        
        parentEl.appendChild(element);
        return element;
    }
    
    /**
     * Safely update calculator results display
     * @param {string} containerId - Container element ID
     * @param {Object} results - Results object
     */
    static updateCalculatorResults(containerId, results) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Clear previous results safely
        container.textContent = '';
        
        // Create results structure safely
        Object.entries(results).forEach(([key, value]) => {
            const row = this.createElement(container, 'div', { className: 'result-row' });
            
            this.createElement(row, 'span', { className: 'result-label' }, key);
            this.createElement(row, 'span', { className: 'result-value' }, String(value));
        });
    }
    
    /**
     * Safely create notification messages
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Display duration in ms (0 = permanent)
     */
    static showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createElement(document.body, 'div', {
            className: `notification notification-${type}`,
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '1rem',
                backgroundColor: this.getNotificationColor(type),
                color: 'white',
                borderRadius: '4px',
                zIndex: '9999',
                maxWidth: '400px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }
        }, this.sanitizeString(message));
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, duration);
        }
        
        return notification;
    }
    
    /**
     * Safely populate form validation errors
     * @param {Object} errors - Validation errors object
     */
    static displayFormErrors(errors) {
        // Clear existing errors
        document.querySelectorAll('.form-error').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
        
        Object.entries(errors).forEach(([fieldName, errorMessage]) => {
            const field = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
            if (field) {
                // Add error class to field
                field.classList.add('error');
                
                // Create error message element
                const errorEl = this.createElement(field.parentNode, 'div', {
                    className: 'form-error',
                    style: { color: '#e53e3e', fontSize: '0.875rem', marginTop: '0.25rem' }
                }, this.sanitizeString(errorMessage));
            }
        });
    }
    
    /**
     * Safely create loading states
     * @param {Element|string} element - Target element
     * @param {boolean} isLoading - Loading state
     * @param {string} loadingText - Loading message
     */
    static setLoadingState(element, isLoading, loadingText = 'Loading...') {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (!el) return;
        
        if (isLoading) {
            el.setAttribute('data-original-content', el.textContent);
            el.textContent = this.sanitizeString(loadingText);
            el.disabled = true;
            el.classList.add('loading');
        } else {
            const originalContent = el.getAttribute('data-original-content');
            if (originalContent) {
                el.textContent = originalContent;
                el.removeAttribute('data-original-content');
            }
            el.disabled = false;
            el.classList.remove('loading');
        }
    }
    
    /**
     * Sanitize string input to prevent XSS
     * @param {any} input - Input to sanitize
     * @returns {string} Sanitized string
     */
    static sanitizeString(input) {
        if (typeof input !== 'string') {
            input = String(input || '');
        }
        
        return input
            .replace(/[<>]/g, '') // Remove < and > characters
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .trim();
    }
    
    /**
     * Get notification background color by type
     * @param {string} type - Notification type
     * @returns {string} CSS color value
     */
    static getNotificationColor(type) {
        const colors = {
            success: '#38a169',
            error: '#e53e3e',
            warning: '#d69e2e',
            info: '#3182ce'
        };
        return colors[type] || colors.info;
    }
    
    /**
     * Safely create table from data
     * @param {Element|string} container - Container element
     * @param {Array} data - Array of objects for table rows
     * @param {Array} columns - Column definitions
     */
    static createTable(container, data, columns) {
        const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
        if (!containerEl) return;
        
        containerEl.textContent = ''; // Clear safely
        
        const table = this.createElement(containerEl, 'table', { className: 'data-table' });
        
        // Create header
        const thead = this.createElement(table, 'thead');
        const headerRow = this.createElement(thead, 'tr');
        
        columns.forEach(column => {
            this.createElement(headerRow, 'th', {}, this.sanitizeString(column.title || column.key));
        });
        
        // Create body
        const tbody = this.createElement(table, 'tbody');
        
        data.forEach(row => {
            const tr = this.createElement(tbody, 'tr');
            
            columns.forEach(column => {
                const value = row[column.key];
                const displayValue = column.format ? column.format(value) : value;
                this.createElement(tr, 'td', {}, this.sanitizeString(displayValue));
            });
        });
        
        return table;
    }
    
    /**
     * Escape HTML to prevent XSS in text content
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecureDOMUtils;
}

// Make available globally
window.SecureDOM = SecureDOMUtils;