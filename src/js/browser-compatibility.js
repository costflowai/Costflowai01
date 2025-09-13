/**
 * CostFlowAI Browser Compatibility Polyfills
 * Ensures consistent functionality across browsers including IE11+
 */

(function() {
  'use strict';
  
  // Core polyfills for older browsers
  
  // 1. Object.entries polyfill (IE11 support)
  if (!Object.entries) {
    Object.entries = function(obj) {
      var keys = Object.keys(obj);
      var i = keys.length;
      var resArray = new Array(i);
      while (i--) {
        resArray[i] = [keys[i], obj[keys[i]]];
      }
      return resArray;
    };
  }
  
  // 2. Object.assign polyfill (IE11 support)
  if (!Object.assign) {
    Object.assign = function(target) {
      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var to = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        if (nextSource !== null && nextSource !== undefined) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
  
  // 3. String.includes polyfill (IE11 support)
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== 'number') {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }
  
  // 4. String.startsWith polyfill (IE11 support)
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(searchString, position) {
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
    };
  }
  
  // 5. String.endsWith polyfill (IE11 support)
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(searchString, length) {
      if (length === undefined || length > this.length) {
        length = this.length;
      }
      return this.substring(length - searchString.length, length) === searchString;
    };
  }
  
  // 6. Array.from polyfill (IE11 support)
  if (!Array.from) {
    Array.from = function(arrayLike, mapFn, thisArg) {
      var items = Object(arrayLike);
      var len = parseInt(items.length) || 0;
      var A = typeof this === 'function' ? new this(len) : new Array(len);
      var k = 0;
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof thisArg === 'undefined' ? mapFn(kValue, k) : mapFn.call(thisArg, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }
  
  // 7. Element.closest polyfill (IE11 support)
  if (!Element.prototype.closest) {
    Element.prototype.closest = function(selector) {
      var el = this;
      while (el && el.nodeType === 1) {
        if (el.matches && el.matches(selector)) {
          return el;
        }
        el = el.parentNode;
      }
      return null;
    };
  }
  
  // 8. Element.matches polyfill (IE11 support)
  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || 
                                Element.prototype.webkitMatchesSelector;
  }
  
  // 9. NodeList.forEach polyfill (IE11 support)
  if (!NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function(callback, thisArg) {
      thisArg = thisArg || window;
      for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    };
  }
  
  // 10. Number.isNaN polyfill (IE11 support)
  if (!Number.isNaN) {
    Number.isNaN = function(value) {
      return typeof value === 'number' && isNaN(value);
    };
  }
  
  // 11. Number.isInteger polyfill (IE11 support)
  if (!Number.isInteger) {
    Number.isInteger = function(value) {
      return typeof value === 'number' && 
             isFinite(value) && 
             Math.floor(value) === value;
    };
  }
  
  // 12. Fetch polyfill fallback (for older browsers)
  window.fetchPolyfill = function(url, options) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open(options && options.method || 'GET', url);
      
      if (options && options.headers) {
        for (var key in options.headers) {
          xhr.setRequestHeader(key, options.headers[key]);
        }
      }
      
      xhr.onload = function() {
        var response = {
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          text: function() {
            return Promise.resolve(xhr.responseText);
          },
          json: function() {
            return Promise.resolve(JSON.parse(xhr.responseText));
          }
        };
        resolve(response);
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error'));
      };
      
      xhr.send(options && options.body || null);
    });
  };
  
  // Use fetch polyfill if fetch is not available
  if (!window.fetch) {
    window.fetch = window.fetchPolyfill;
  }
  
  // 13. Promise polyfill (IE11 support) - simplified version
  if (!window.Promise) {
    window.Promise = function(executor) {
      var self = this;
      self.state = 'pending';
      self.value = undefined;
      self.handlers = [];
      
      function resolve(result) {
        if (self.state === 'pending') {
          self.state = 'fulfilled';
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }
      
      function reject(error) {
        if (self.state === 'pending') {
          self.state = 'rejected';
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }
      
      function handle(handler) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          setTimeout(function() {
            var cb = self.state === 'fulfilled' ? handler.onFulfilled : handler.onRejected;
            if (cb === null) {
              (self.state === 'fulfilled' ? handler.resolve : handler.reject)(self.value);
              return;
            }
            try {
              var result = cb(self.value);
              handler.resolve(result);
            } catch (error) {
              handler.reject(error);
            }
          }, 0);
        }
      }
      
      this.then = function(onFulfilled, onRejected) {
        return new Promise(function(resolve, reject) {
          handle({
            onFulfilled: onFulfilled || null,
            onRejected: onRejected || null,
            resolve: resolve,
            reject: reject
          });
        });
      };
      
      this.catch = function(onRejected) {
        return this.then(null, onRejected);
      };
      
      try {
        executor(resolve, reject);
      } catch (error) {
        reject(error);
      }
    };
    
    Promise.resolve = function(value) {
      return new Promise(function(resolve) {
        resolve(value);
      });
    };
    
    Promise.reject = function(reason) {
      return new Promise(function(resolve, reject) {
        reject(reason);
      });
    };
  }
  
  // 14. Custom event polyfill (IE11 support)
  if (typeof window.CustomEvent !== 'function') {
    function CustomEvent(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: undefined };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    CustomEvent.prototype = window.Event.prototype;
    window.CustomEvent = CustomEvent;
  }
  
  // 15. Clipboard API fallback
  if (!navigator.clipboard) {
    navigator.clipboard = {
      writeText: function(text) {
        return new Promise(function(resolve, reject) {
          try {
            var textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            
            var successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (successful) {
              resolve();
            } else {
              reject(new Error('Copy command failed'));
            }
          } catch (error) {
            reject(error);
          }
        });
      }
    };
  }
  
  // 16. Browser capability detection
  window.BrowserSupport = {
    // Feature detection
    hasLocalStorage: function() {
      try {
        var test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch(e) {
        return false;
      }
    },
    
    hasJSON: function() {
      return typeof JSON !== 'undefined' && JSON.parse && JSON.stringify;
    },
    
    hasQuerySelector: function() {
      return document.querySelector && document.querySelectorAll;
    },
    
    hasClassList: function() {
      return 'classList' in document.createElement('div');
    },
    
    hasAddEventListener: function() {
      return 'addEventListener' in window;
    },
    
    hasFetch: function() {
      return typeof fetch !== 'undefined';
    },
    
    hasPromise: function() {
      return typeof Promise !== 'undefined';
    },
    
    hasConsole: function() {
      return typeof console !== 'undefined' && console.log;
    },
    
    // Browser detection
    isIE: function() {
      return navigator.userAgent.indexOf('MSIE') !== -1 || 
             navigator.userAgent.indexOf('Trident/') !== -1;
    },
    
    isEdge: function() {
      return navigator.userAgent.indexOf('Edge/') !== -1;
    },
    
    isChrome: function() {
      return navigator.userAgent.indexOf('Chrome/') !== -1 && 
             navigator.userAgent.indexOf('Edge/') === -1;
    },
    
    isFirefox: function() {
      return navigator.userAgent.indexOf('Firefox/') !== -1;
    },
    
    isSafari: function() {
      return navigator.userAgent.indexOf('Safari/') !== -1 && 
             navigator.userAgent.indexOf('Chrome/') === -1;
    },
    
    isMobile: function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Version detection
    getIEVersion: function() {
      var match = navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);
      return match ? parseInt(match[1]) : null;
    },
    
    // Overall compatibility check
    isSupported: function() {
      return this.hasLocalStorage() && 
             this.hasJSON() && 
             this.hasQuerySelector() && 
             this.hasAddEventListener() &&
             (!this.isIE() || this.getIEVersion() >= 11);
    },
    
    // Get compatibility report
    getReport: function() {
      return {
        browser: {
          isIE: this.isIE(),
          isEdge: this.isEdge(),
          isChrome: this.isChrome(),
          isFirefox: this.isFirefox(),
          isSafari: this.isSafari(),
          isMobile: this.isMobile(),
          ieVersion: this.getIEVersion()
        },
        features: {
          localStorage: this.hasLocalStorage(),
          json: this.hasJSON(),
          querySelector: this.hasQuerySelector(),
          classList: this.hasClassList(),
          addEventListener: this.hasAddEventListener(),
          fetch: this.hasFetch(),
          promise: this.hasPromise(),
          console: this.hasConsole()
        },
        isSupported: this.isSupported()
      };
    }
  };
  
  // 17. Console polyfill (IE8-9 support)
  if (!window.console) {
    window.console = {
      log: function() {},
      warn: function() {},
      error: function() {},
      info: function() {},
      debug: function() {}
    };
  }
  
  // 18. CSS fixes for older browsers
  var browserFixes = document.createElement('style');
  browserFixes.id = 'browser-compatibility-fixes';
  browserFixes.textContent = `
    /* IE11 Flexbox fixes */
    .nav-tabs {
      display: -ms-flexbox;
      display: flex;
      -ms-flex-wrap: wrap;
      flex-wrap: wrap;
    }
    
    .calc-grid {
      display: -ms-grid;
      display: grid;
      -ms-grid-columns: 1fr 1fr;
      grid-template-columns: 1fr 1fr;
    }
    
    /* IE11 CSS Grid fallback */
    @supports not (display: grid) {
      .calc-grid {
        display: table;
        width: 100%;
        table-layout: fixed;
      }
      .input-section,
      .results-section {
        display: table-cell;
        vertical-align: top;
        width: 50%;
        padding: 15px;
      }
    }
    
    /* iOS Safari specific fixes */
    @supports (-webkit-overflow-scrolling: touch) {
      input[type="number"] {
        -webkit-appearance: none;
        -moz-appearance: textfield;
      }
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }
    
    /* Edge specific fixes */
    @supports (-ms-ime-align: auto) {
      .tab-btn {
        flex-shrink: 0;
      }
    }
  `;
  
  document.head.appendChild(browserFixes);
  
  // 19. Initialize compatibility warnings
  function showCompatibilityWarning() {
    var report = window.BrowserSupport.getReport();
    
    if (!report.isSupported) {
      var message = 'Your browser may have limited support for some features. ';
      if (report.browser.isIE && report.browser.ieVersion < 11) {
        message += 'Please update to Internet Explorer 11 or use a modern browser for the best experience.';
      } else {
        message += 'Please update your browser for the best experience.';
      }
      
      // Show warning using error system if available
      if (window.showCalculatorError) {
        window.showCalculatorError(message, 'warning', 10000);
      } else {
        // Fallback alert
        setTimeout(function() {
          alert(message);
        }, 1000);
      }
    }
  }
  
  // Show compatibility warning after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showCompatibilityWarning);
  } else {
    showCompatibilityWarning();
  }
  
  console.log('Browser compatibility polyfills loaded');
})();