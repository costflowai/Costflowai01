// File: /assets/js/calculator-core.js
class ProCalculator {
  constructor(name) {
    this.name = name;
    this.inputs = {};
    this.results = {};
    this.history = this.loadHistory();
    this.initialized = true;
  }
  
  loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(`${this.name}_history`) || '[]');
    } catch(e) {
      return [];
    }
  }
  
  saveCalculation() {
    try {
      const calc = {
        timestamp: new Date().toISOString(),
        inputs: {...this.inputs},
        results: {...this.results}
      };
      this.history.unshift(calc);
      this.history = this.history.slice(0, 10);
      localStorage.setItem(`${this.name}_history`, JSON.stringify(this.history));
      this.showNotification('Calculation saved!');
      return true;
    } catch(e) {
      console.error('Save failed:', e);
      return false;
    }
  }
  
  exportCSV() {
    let csv = 'CostFlowAI Calculator Export\n';
    csv += `Calculator: ${this.name}\n`;
    csv += `Date: ${new Date().toLocaleString()}\n\n`;
    csv += 'INPUTS\n';
    for (let [key, value] of Object.entries(this.inputs)) {
      csv += `${this.formatLabel(key)},${value}\n`;
    }
    csv += '\nRESULTS\n';
    for (let [key, value] of Object.entries(this.results)) {
      csv += `${this.formatLabel(key)},${value}\n`;
    }
    
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `costflowai_${this.name}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  shareLink() {
    const data = btoa(JSON.stringify(this.inputs));
    const url = `${window.location.origin}${window.location.pathname}?calc=${data}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.showNotification('Share link copied!');
      });
    } else {
      prompt('Copy this link:', url);
    }
  }
  
  loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('calc')) {
      try {
        this.inputs = JSON.parse(atob(params.get('calc')));
        this.populateInputs();
        return true;
      } catch(e) {
        console.error('Failed to load shared data');
      }
    }
    return false;
  }
  
  populateInputs() {
    for (let [key, value] of Object.entries(this.inputs)) {
      const el = document.getElementById(key);
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event('input'));
      }
    }
  }
  
  loadLastUsed() {
    if (this.history && this.history.length > 0) {
      this.inputs = this.history[0].inputs;
      this.populateInputs();
      this.showNotification('Last calculation loaded');
      return true;
    }
    return false;
  }
  
  formatLabel(key) {
    return key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .replace(/_/g, ' ');
  }
  
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'calc-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  validateInput(value, min, max, fieldName) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a number`);
    }
    if (num < min || num > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }
    return num;
  }
}

// Add notification animation
if (!document.getElementById('calc-styles')) {
  const style = document.createElement('style');
  style.id = 'calc-styles';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}