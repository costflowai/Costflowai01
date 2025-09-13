/**
 * BULLETPROOF CALCULATOR CORE - SELF-CONTAINED SYSTEM
 * Version: 3.0 Emergency Deploy
 * Features: Save, Export, Share, History, Notifications, Error Handling
 * Dependencies: None (fully self-contained)
 */

class ProCalculator {
  constructor(name) {
    this.name = name;
    this.inputs = {};
    this.results = {};
    this.history = this.loadHistory();
    this.initialized = true;
    this.version = '3.0';
    
    // Initialize styles and event listeners
    this.initializeStyles();
    this.initializeEventListeners();
    
    // Auto-load from URL if present
    setTimeout(() => this.loadFromURL(), 100);
    
    console.log(`✅ ProCalculator "${name}" initialized successfully`);
  }
  
  // ==================== CORE STORAGE FUNCTIONALITY ====================
  
  loadHistory() {
    try {
      const stored = localStorage.getItem(`costflowai_${this.name}_history`);
      const history = stored ? JSON.parse(stored) : [];
      console.log(`📂 Loaded ${history.length} saved calculations for ${this.name}`);
      return history;
    } catch(e) {
      console.error('❌ History load failed:', e);
      return [];
    }
  }
  
  saveCalculation() {
    try {
      // Collect all current inputs
      this.collectInputs();
      
      const calculation = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: this.name,
        inputs: JSON.parse(JSON.stringify(this.inputs)),
        results: JSON.parse(JSON.stringify(this.results)),
        version: this.version,
        userAgent: navigator.userAgent.substring(0, 50)
      };
      
      // Add to history (keep last 25)
      this.history.unshift(calculation);
      this.history = this.history.slice(0, 25);
      
      // Save to localStorage with multiple keys for redundancy
      localStorage.setItem(`costflowai_${this.name}_history`, JSON.stringify(this.history));
      localStorage.setItem(`costflowai_${this.name}_last`, JSON.stringify(calculation));
      localStorage.setItem(`costflowai_${this.name}_backup_${Date.now()}`, JSON.stringify(calculation));
      
      this.showNotification('✅ Calculation saved successfully!', 'success');
      console.log(`💾 Saved calculation ${calculation.id} for ${this.name}`);
      return calculation.id;
      
    } catch(e) {
      console.error('❌ Save failed:', e);
      this.showNotification('❌ Save failed - please try again', 'error');
      return false;
    }
  }
  
  loadCalculation(id) {
    try {
      const calc = this.history.find(h => h.id === id);
      if (calc) {
        this.inputs = calc.inputs;
        this.results = calc.results;
        this.populateInputs();
        this.showNotification('✅ Calculation loaded', 'success');
        return true;
      }
      return false;
    } catch(e) {
      console.error('❌ Load failed:', e);
      return false;
    }
  }
  
  loadLastUsed() {
    try {
      const last = localStorage.getItem(`costflowai_${this.name}_last`);
      if (last) {
        const data = JSON.parse(last);
        this.inputs = data.inputs || {};
        this.results = data.results || {};
        this.populateInputs();
        this.showNotification('✅ Last calculation loaded', 'info');
        return true;
      } else {
        this.showNotification('ℹ️ No saved calculations found', 'info');
        return false;
      }
    } catch(e) {
      console.error('❌ Load last used failed:', e);
      this.showNotification('❌ Could not load last calculation', 'error');
      return false;
    }
  }
  
  // ==================== EXPORT FUNCTIONALITY ====================
  
  exportCSV() {
    try {
      this.collectInputs();
      const timestamp = new Date().toISOString().split('T')[0];
      
      let csv = 'CostFlowAI Professional Calculator Export\n';
      csv += `Calculator,${this.formatLabel(this.name)}\n`;
      csv += `Date,${new Date().toLocaleString()}\n`;
      csv += `Version,${this.version}\n`;
      csv += `Website,costflowai.com\n\n`;
      
      // Inputs section
      csv += 'INPUTS\n';
      csv += 'Parameter,Value,Unit\n';
      for (let [key, value] of Object.entries(this.inputs)) {
        const label = this.formatLabel(key);
        const unit = this.getUnit(key);
        const cleanValue = String(value).replace(/,/g, '');
        csv += `"${label}","${cleanValue}","${unit}"\n`;
      }
      
      // Results section
      csv += '\nRESULTS\n';
      csv += 'Metric,Value,Unit\n';
      for (let [key, value] of Object.entries(this.results)) {
        const label = this.formatLabel(key);
        const unit = this.getUnit(key);
        const cleanValue = String(value).replace(/,/g, '');
        csv += `"${label}","${cleanValue}","${unit}"\n`;
      }
      
      // Metadata
      csv += '\nMETADATA\n';
      csv += `Export Time,"${new Date().toISOString()}"\n`;
      csv += `Calculator Version,"${this.version}"\n`;
      csv += `User Agent,"${navigator.userAgent.substring(0, 100)}"\n`;
      
      // Disclaimer
      csv += '\nDISCLAIMER\n';
      csv += '"This is a rough order of magnitude (ROM) estimate only."\n';
      csv += '"Always verify with licensed contractors and local codes."\n';
      csv += '"CostFlowAI provides tools for planning purposes only."\n';
      
      // Create and download file
      const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = `CostFlowAI_${this.name}_${timestamp}_${Date.now()}.csv`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      this.showNotification('📊 CSV exported successfully!', 'success');
      console.log(`📊 CSV exported for ${this.name}`);
      
    } catch(e) {
      console.error('❌ CSV export failed:', e);
      this.showNotification('❌ Export failed - please try again', 'error');
    }
  }
  
  exportPDF() {
    try {
      // Prepare print-friendly version
      const printContent = this.generatePrintContent();
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Auto-print after content loads
      printWindow.onload = function() {
        printWindow.print();
        // Don't close automatically - let user decide
      };
      
      this.showNotification('📄 PDF ready - complete print dialog', 'info');
      console.log(`📄 PDF prepared for ${this.name}`);
      
    } catch(e) {
      console.error('❌ PDF export failed:', e);
      this.showNotification('❌ PDF generation failed', 'error');
    }
  }
  
  // ==================== SHARING FUNCTIONALITY ====================
  
  shareLink() {
    try {
      this.collectInputs();
      
      const shareData = {
        v: this.version,
        c: this.name,
        i: this.inputs,
        r: this.results,
        t: Date.now()
      };
      
      const encodedData = btoa(JSON.stringify(shareData));
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?calc=${encodedData}`;
      
      // Try modern share API first
      if (navigator.share && navigator.canShare && navigator.canShare({url: shareUrl})) {
        navigator.share({
          title: `${this.formatLabel(this.name)} Calculation - CostFlowAI`,
          text: 'Check out my construction calculation on CostFlowAI',
          url: shareUrl
        }).then(() => {
          this.showNotification('🔗 Shared successfully!', 'success');
          console.log('🔗 Shared via Web Share API');
        }).catch((e) => {
          console.log('Web Share API failed, falling back to clipboard');
          this.copyToClipboard(shareUrl);
        });
      } else {
        // Fallback to clipboard
        this.copyToClipboard(shareUrl);
      }
      
    } catch(e) {
      console.error('❌ Share failed:', e);
      this.showNotification('❌ Share failed - please try again', 'error');
    }
  }
  
  copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Modern clipboard API
        navigator.clipboard.writeText(text).then(() => {
          this.showNotification('🔗 Share link copied to clipboard!', 'success');
          console.log('🔗 Link copied via Clipboard API');
        }).catch(() => {
          this.fallbackCopyToClipboard(text);
        });
      } else {
        // Fallback method
        this.fallbackCopyToClipboard(text);
      }
    } catch(e) {
      this.fallbackCopyToClipboard(text);
    }
  }
  
  fallbackCopyToClipboard(text) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999); // For mobile devices
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        this.showNotification('🔗 Share link copied!', 'success');
        console.log('🔗 Link copied via fallback method');
      } else {
        // Ultimate fallback - show the link
        this.showShareDialog(text);
      }
    } catch(e) {
      this.showShareDialog(text);
    }
  }
  
  showShareDialog(text) {
    const truncated = text.length > 100 ? text.substring(0, 100) + '...' : text;
    const result = prompt('Copy this share link:', text);
    this.showNotification('🔗 Share link ready', 'info');
  }
  
  loadFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('calc')) {
        const data = JSON.parse(atob(params.get('calc')));
        
        if (data.c === this.name && data.i) {
          this.inputs = data.i;
          this.results = data.r || {};
          this.populateInputs();
          this.showNotification('✅ Loaded shared calculation', 'info');
          console.log('🔗 Loaded calculation from share URL');
          return true;
        }
      }
    } catch(e) {
      console.log('No valid shared data in URL');
    }
    return false;
  }
  
  // ==================== INPUT/OUTPUT MANAGEMENT ====================
  
  collectInputs() {
    this.inputs = {};
    
    // Collect all number inputs
    document.querySelectorAll('input[type="number"], input[type="text"], input[type="range"]').forEach(input => {
      if (input.id) {
        this.inputs[input.id] = input.value;
      }
    });
    
    // Collect all select inputs
    document.querySelectorAll('select').forEach(select => {
      if (select.id) {
        this.inputs[select.id] = select.value;
      }
    });
    
    // Collect checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      if (checkbox.id) {
        this.inputs[checkbox.id] = checkbox.checked;
      }
    });
    
    // Collect radio buttons
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
      if (radio.name) {
        this.inputs[radio.name] = radio.value;
      }
    });
    
    console.log(`📝 Collected ${Object.keys(this.inputs).length} inputs`);
  }
  
  populateInputs() {
    let populated = 0;
    
    for (let [key, value] of Object.entries(this.inputs)) {
      const element = document.getElementById(key);
      
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else if (element.type === 'radio') {
          const radio = document.querySelector(`input[name="${key}"][value="${value}"]`);
          if (radio) radio.checked = true;
        } else {
          element.value = value;
        }
        
        // Trigger events to update calculations
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        populated++;
      }
    }
    
    console.log(`📥 Populated ${populated} input fields`);
  }
  
  // ==================== UTILITY FUNCTIONS ====================
  
  reset() {
    try {
      // Reset all inputs to defaults
      document.querySelectorAll('input[type="number"]').forEach(input => {
        const defaultVal = input.getAttribute('data-default') || input.defaultValue || '';
        input.value = defaultVal;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = checkbox.defaultChecked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      this.inputs = {};
      this.results = {};
      this.showNotification('🔄 Reset to defaults', 'info');
      
    } catch(e) {
      console.error('❌ Reset failed:', e);
      this.showNotification('❌ Reset failed', 'error');
    }
  }
  
  validateInput(value, min, max, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a valid number`);
    }
    if (min !== undefined && num < min) {
      throw new Error(`${fieldName} must be at least ${min}`);
    }
    if (max !== undefined && num > max) {
      throw new Error(`${fieldName} must not exceed ${max}`);
    }
    return num;
  }
  
  formatLabel(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
  
  getUnit(key) {
    const units = {
      length: 'ft', width: 'ft', height: 'ft', depth: 'ft', thickness: 'in',
      area: 'sq ft', volume: 'cu yd', weight: 'lbs', count: 'pcs',
      cost: '$', price: '$', rate: '$', percentage: '%', percent: '%',
      time: 'hrs', hours: 'hrs', days: 'days', weeks: 'weeks'
    };
    
    const lowerKey = key.toLowerCase();
    for (let [pattern, unit] of Object.entries(units)) {
      if (lowerKey.includes(pattern)) return unit;
    }
    return '';
  }
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  formatNumber(num, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }
  
  // ==================== UI COMPONENTS ====================
  
  showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.calc-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `calc-notification ${type}`;
    notification.textContent = message;
    
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
      warning: '#f59e0b'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 500;
      max-width: 400px;
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
    `;
    
    // Click to dismiss
    notification.onclick = () => notification.remove();
    
    document.body.appendChild(notification);
    
    // Auto-remove after delay
    const delay = type === 'error' ? 7000 : 4000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, delay);
    
    console.log(`🔔 Notification: ${message}`);
  }
  
  generatePrintContent() {
    this.collectInputs();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${this.formatLabel(this.name)} - CostFlowAI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1e3a5f; margin-bottom: 10px; }
    .header p { color: #666; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 15px; }
    .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ccc; }
    .item:last-child { border-bottom: none; }
    .label { font-weight: 600; }
    .value { color: #333; }
    .disclaimer { background: #f8f8f8; padding: 20px; border-left: 4px solid #ff6b35; margin-top: 30px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; color: #666; }
    @media print { body { padding: 0; } .header { page-break-after: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.formatLabel(this.name)}</h1>
    <p>Professional Construction Calculator | CostFlowAI</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="two-column">
    <div class="section">
      <h2>📥 Project Inputs</h2>
      ${Object.entries(this.inputs).map(([key, value]) => 
        `<div class="item">
          <span class="label">${this.formatLabel(key)}:</span>
          <span class="value">${value} ${this.getUnit(key)}</span>
        </div>`
      ).join('')}
    </div>
    
    <div class="section">
      <h2>📊 Calculation Results</h2>
      ${Object.entries(this.results).map(([key, value]) => 
        `<div class="item">
          <span class="label">${this.formatLabel(key)}:</span>
          <span class="value">${value} ${this.getUnit(key)}</span>
        </div>`
      ).join('')}
    </div>
  </div>
  
  <div class="disclaimer">
    <h3>⚠️ Important Disclaimer</h3>
    <p><strong>This is a Rough Order of Magnitude (ROM) estimate only.</strong></p>
    <p>Actual costs vary significantly based on location, site conditions, material availability, labor rates, and specific project requirements. Always obtain detailed quotes from licensed contractors and verify calculations with local building codes before making construction decisions.</p>
  </div>
  
  <div class="footer">
    <p>Generated by CostFlowAI Professional Calculators | costflowai.com</p>
    <p>Calculator Version: ${this.version} | Export Time: ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
  }
  
  initializeStyles() {
    if (document.getElementById('calc-bulletproof-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'calc-bulletproof-styles';
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      .calc-notification {
        z-index: 10001 !important;
        pointer-events: auto !important;
        user-select: none;
        transition: all 0.3s ease;
      }
      
      .calc-notification:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.3) !important;
      }
      
      @media print {
        .calc-notification { display: none !important; }
        .no-print { display: none !important; }
        .calc-actions { display: none !important; }
        .quick-actions { display: none !important; }
      }
      
      @media (max-width: 768px) {
        .calc-notification {
          right: 10px !important;
          left: 10px !important;
          max-width: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  initializeEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 's':
            e.preventDefault();
            this.saveCalculation();
            break;
          case 'e':
            e.preventDefault();
            this.exportCSV();
            break;
          case 'l':
            e.preventDefault();
            this.loadLastUsed();
            break;
        }
      }
    });
    
    // Auto-save on input change (debounced)
    let saveTimeout;
    document.addEventListener('input', (e) => {
      if (e.target.matches('input, select')) {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          this.collectInputs();
        }, 1000);
      }
    });
  }
}

// ==================== GLOBAL INITIALIZATION ====================

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBulletproofSystem);
} else {
  initializeBulletproofSystem();
}

function initializeBulletproofSystem() {
  console.log('🚀 Bulletproof Calculator System v3.0 Loading...');
  
  // Make ProCalculator globally available
  window.ProCalculator = ProCalculator;
  
  // Global utility functions
  window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  window.formatNumber = function(num, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };
  
  console.log('✅ Bulletproof Calculator System Ready');
}

// Emergency fallback error handler
window.addEventListener('error', function(e) {
  console.error('💥 Calculator System Error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('💥 Unhandled Promise Rejection:', e.reason);
});

console.log('📦 Bulletproof Calculator Core v3.0 Loaded');