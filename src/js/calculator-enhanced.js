// Enhanced Calculator Functionality
class CostCalculator {
    constructor(formId, resultId) {
        this.form = document.getElementById(formId);
        this.result = document.getElementById(resultId);
        this.init();
    }
    
    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Auto-calculate on input change
            const inputs = this.form.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('change', () => this.autoCalculate());
            });
            
            // Add input validation
            this.addValidation();
            
            // Load saved values from localStorage
            this.loadSavedValues();
        }
    }
    
    handleSubmit(e) {
        e.preventDefault();
        this.calculate();
        this.saveValues();
        
        // Track calculation event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculate', {
                event_category: 'calculator',
                event_label: this.form.id
            });
        }
    }
    
    autoCalculate() {
        if (this.form.checkValidity()) {
            this.calculate();
        }
    }
    
    calculate() {
        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<span class="loading"></span> Calculating...';
        submitBtn.disabled = true;
        
        // Simulate AI processing delay
        setTimeout(() => {
            const data = this.getFormData();
            const result = this.performCalculation(data);
            this.displayResult(result);
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 500);
    }
    
    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = parseFloat(value) || value;
        }
        return data;
    }
    
    performCalculation(data) {
        // Residential ROM calculation
        if (this.form.id === 'residential-form') {
            const sqft = data.sqft || 2500;
            const quality = data.quality || 180;
            const stories = data.stories || 1.08;
            const region = data.region || 1.0;
            const contingency = (data.contingency || 10) / 100;
            
            // Base calculation
            let baseTotal = sqft * quality * stories * region;
            
            // Add contingency
            const contingencyAmount = baseTotal * contingency;
            const total = baseTotal + contingencyAmount;
            
            // Detailed breakdown
            const breakdown = {
                'Base Construction': baseTotal * 0.60,
                'Site Work & Foundation': baseTotal * 0.15,
                'Mechanical Systems': baseTotal * 0.12,
                'Finishes & Fixtures': baseTotal * 0.08,
                'Permits & Fees': baseTotal * 0.05,
                'Contingency': contingencyAmount
            };
            
            return {
                total: total,
                perSqft: total / sqft,
                breakdown: breakdown,
                params: data
            };
        }
        
        // Add other calculator types here
        return { total: 0, perSqft: 0, breakdown: {}, params: data };
    }
    
    displayResult(result) {
        if (!this.result) return;
        
        // Show result section with animation
        this.result.style.display = 'block';
        this.result.style.opacity = '0';
        setTimeout(() => {
            this.result.style.transition = 'opacity 0.5s';
            this.result.style.opacity = '1';
        }, 10);
        
        // Update total
        const totalElement = document.getElementById('result-value');
        if (totalElement) {
            this.animateNumber(totalElement, 0, result.total);
        }
        
        // Update per sqft
        const perSqftElement = document.getElementById('cost-per-sqft');
        if (perSqftElement) {
            perSqftElement.textContent = '$' + result.perSqft.toFixed(2);
        }
        
        // Update breakdown
        const breakdownElement = document.getElementById('breakdown-details');
        if (breakdownElement) {
            breakdownElement.innerHTML = '';
            for (let [category, amount] of Object.entries(result.breakdown)) {
                const row = document.createElement('div');
                row.className = 'breakdown-row';
                row.innerHTML = `
                    <span>${category}:</span>
                    <span>$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                `;
                breakdownElement.appendChild(row);
            }
        }
        
        // Scroll to result
        this.result.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    animateNumber(element, start, end) {
        const duration = 1000;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = start + (end - start) * easeOutQuart;
            
            element.textContent = '$' + current.toLocaleString('en-US', { maximumFractionDigits: 0 });
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };
        
        requestAnimationFrame(updateNumber);
    }
    
    addValidation() {
        const inputs = this.form.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.style.borderColor = '#ef4444';
                } else {
                    input.style.borderColor = '';
                }
            });
        });
    }
    
    saveValues() {
        const data = this.getFormData();
        localStorage.setItem(this.form.id + '_data', JSON.stringify(data));
    }
    
    loadSavedValues() {
        const saved = localStorage.getItem(this.form.id + '_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.keys(data).forEach(key => {
                    const input = this.form.querySelector(`[name="${key}"], #${key}`);
                    if (input) {
                        input.value = data[key];
                    }
                });
            } catch (e) {
                console.error('Error loading saved values:', e);
            }
        }
    }
}

// Copy to clipboard functionality
function copyResult() {
    const resultText = document.getElementById('result').innerText;
    navigator.clipboard.writeText(resultText).then(() => {
        const successMsg = document.querySelector('.success-message');
        if (successMsg) {
            successMsg.style.display = 'block';
            setTimeout(() => successMsg.style.display = 'none', 3000);
        }
    });
}

// Print functionality
function printResult() {
    window.print();
}

// Export to CSV
function exportToCSV() {
    const result = document.getElementById('breakdown-details');
    if (!result) return;
    
    let csv = 'Category,Amount\n';
    const rows = result.querySelectorAll('.breakdown-row');
    rows.forEach(row => {
        const cells = row.querySelectorAll('span');
        if (cells.length === 2) {
            csv += `"${cells[0].textContent.replace(':', '')}","${cells[1].textContent}"\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost-estimate.csv';
    a.click();
    
    // Track export event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'export', {
            event_category: 'calculator',
            event_label: 'csv'
        });
    }
}

// Initialize calculator on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize for residential calculator
    if (document.getElementById('residential-form')) {
        new CostCalculator('residential-form', 'result');
    }
    
    // Initialize for other calculators
    if (document.getElementById('commercial-form')) {
        new CostCalculator('commercial-form', 'result');
    }
    
    if (document.getElementById('concrete-form')) {
        new CostCalculator('concrete-form', 'result');
    }
});

// Add print styles
const printStyles = `
@media print {
    header, footer, .mobile-menu-btn, button, .info-box { display: none !important; }
    .calculator-result { page-break-inside: avoid; }
    body { font-size: 12pt; }
}
`;
const styleSheet = document.createElement('style');
styleSheet.textContent = printStyles;
document.head.appendChild(styleSheet);