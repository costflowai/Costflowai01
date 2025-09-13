/**
 * CostFlowAI Export Manager
 * Handles PDF, CSV, and copy functionality for calculator results
 */

class ExportManager {
    constructor() {
        this.initializeExportButtons();
        console.log('📊 Export Manager initialized');
    }

    initializeExportButtons() {
        document.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (!action) return;

            switch (action) {
                case 'export':
                    this.handleExport(e.target);
                    break;
                case 'save':
                    this.handleSave(e.target);
                    break;
                case 'print':
                    this.handlePrint();
                    break;
                case 'email':
                    this.handleEmail(e.target);
                    break;
            }
        });
    }

    handleExport(button) {
        const format = button.getAttribute('data-format') || 'pdf';
        const calculatorType = this.detectCalculatorType();
        
        console.log(`📤 Exporting ${calculatorType} results as ${format.toUpperCase()}`);
        
        switch (format.toLowerCase()) {
            case 'pdf':
                this.exportToPDF(calculatorType);
                break;
            case 'csv':
                this.exportToCSV(calculatorType);
                break;
            case 'copy':
                this.copyToClipboard(calculatorType);
                break;
            default:
                console.warn('Unknown export format:', format);
        }
    }

    handleSave(button) {
        const calculatorType = this.detectCalculatorType();
        this.saveCalculation(calculatorType);
    }

    handlePrint() {
        this.printResults();
    }

    handleEmail(button) {
        const calculatorType = this.detectCalculatorType();
        this.emailResults(calculatorType);
    }

    detectCalculatorType() {
        // Check URL path
        const path = window.location.pathname;
        if (path.includes('concrete')) return 'concrete';
        if (path.includes('framing')) return 'framing';
        if (path.includes('paint')) return 'paint';
        if (path.includes('roofing')) return 'roofing';
        if (path.includes('electrical')) return 'electrical';
        if (path.includes('hvac')) return 'hvac';
        if (path.includes('drywall')) return 'drywall';
        if (path.includes('flooring')) return 'flooring';
        if (path.includes('insulation')) return 'insulation';
        if (path.includes('tile')) return 'tile';
        if (path.includes('plumbing')) return 'plumbing';
        if (path.includes('landscaping')) return 'landscaping';
        
        // Check for active calculator sections
        const calculators = [
            'concrete', 'framing', 'paint', 'roofing', 'electrical', 
            'hvac', 'drywall', 'flooring', 'insulation', 'tile', 
            'plumbing', 'landscaping'
        ];
        
        for (const calc of calculators) {
            const section = document.querySelector(`#${calc}-calc, [data-calculator="${calc}"], .${calc}-calculator`);
            if (section && section.offsetParent !== null) {
                return calc;
            }
        }
        
        return 'general';
    }

    getCalculationData(calculatorType) {
        const data = {
            type: calculatorType,
            timestamp: new Date().toISOString(),
            inputs: {},
            results: {},
            formula: ''
        };

        // Get input values
        const inputSelectors = this.getInputSelectors(calculatorType);
        inputSelectors.forEach(selector => {
            const element = document.querySelector(selector);
            if (element && element.value) {
                const fieldName = element.name || element.id || selector;
                data.inputs[fieldName] = element.value;
            }
        });

        // Get results
        const resultsContainer = document.querySelector(`#${calculatorType}-results, .${calculatorType}-results, [data-results="${calculatorType}"], .project-results, .materials-needed`);
        if (resultsContainer) {
            const resultRows = resultsContainer.querySelectorAll('.result-row');
            resultRows.forEach(row => {
                const label = row.querySelector('.result-label')?.textContent?.replace(':', '').trim();
                const value = row.querySelector('.result-value')?.textContent?.trim();
                if (label && value) {
                    data.results[label] = value;
                }
            });
        }

        // Get formula
        const formulaContainer = document.querySelector(`#${calculatorType}-formula, .${calculatorType}-formula, [data-formula="${calculatorType}"]`);
        if (formulaContainer) {
            data.formula = formulaContainer.textContent.trim();
        }

        return data;
    }

    getInputSelectors(calculatorType) {
        const commonSelectors = ['input[type="number"]', 'input[type="text"]', 'select'];
        const specificSelectors = {
            concrete: ['#concrete-length', '#concrete-width', '#concrete-thickness', '#concrete-psi'],
            framing: ['#framing-area', '#framing-lumber-size', '#framing-spacing'],
            paint: ['#paint-wall-area', '#paint-openings', '#paint-coats', '#paint-quality']
        };

        return [...commonSelectors, ...(specificSelectors[calculatorType] || [])];
    }

    async exportToPDF(calculatorType) {
        try {
            const data = this.getCalculationData(calculatorType);
            
            // Create PDF content
            const pdfContent = this.generatePDFContent(data);
            
            // For now, create a downloadable HTML file that can be printed to PDF
            const blob = new Blob([pdfContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `costflowai-${calculatorType}-estimate-${new Date().getTime()}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showExportSuccess('PDF', 'HTML file created - use browser print to generate PDF');
            
        } catch (error) {
            console.error('PDF export error:', error);
            this.showExportError('PDF export failed');
        }
    }

    generatePDFContent(data) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>CostFlowAI ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Estimate</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .section { margin: 30px 0; }
        .section h3 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        .data-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
        .label { font-weight: 600; }
        .value { color: #059669; font-weight: 700; }
        .formula { background: #f9fafb; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 14px; }
        .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🏗️ CostFlowAI</div>
        <h1>${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Calculator Estimate</h1>
        <p>Generated on ${new Date(data.timestamp).toLocaleDateString()}</p>
    </div>
    
    <div class="section">
        <h3>📝 Project Inputs</h3>
        ${Object.entries(data.inputs).map(([key, value]) => `
            <div class="data-row">
                <span class="label">${this.formatLabel(key)}:</span>
                <span class="value">${value}</span>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h3>📊 Calculation Results</h3>
        ${Object.entries(data.results).map(([key, value]) => `
            <div class="data-row">
                <span class="label">${key}:</span>
                <span class="value">${value}</span>
            </div>
        `).join('')}
    </div>
    
    ${data.formula ? `
    <div class="section">
        <h3>🧮 Calculation Formula</h3>
        <div class="formula">${data.formula}</div>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>Estimate generated by CostFlowAI - Professional Construction Cost Calculator</p>
        <p>Visit us at costflowai.com</p>
    </div>
</body>
</html>`;
    }

    exportToCSV(calculatorType) {
        try {
            const data = this.getCalculationData(calculatorType);
            
            // Create CSV content
            let csvContent = `CostFlowAI ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Estimate\n`;
            csvContent += `Generated,${new Date(data.timestamp).toLocaleDateString()}\n\n`;
            
            csvContent += `Project Inputs\n`;
            csvContent += `Field,Value\n`;
            Object.entries(data.inputs).forEach(([key, value]) => {
                csvContent += `"${this.formatLabel(key)}","${value}"\n`;
            });
            
            csvContent += `\nCalculation Results\n`;
            csvContent += `Item,Amount\n`;
            Object.entries(data.results).forEach(([key, value]) => {
                csvContent += `"${key}","${value}"\n`;
            });
            
            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `costflowai-${calculatorType}-estimate-${new Date().getTime()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showExportSuccess('CSV', 'CSV file downloaded successfully');
            
        } catch (error) {
            console.error('CSV export error:', error);
            this.showExportError('CSV export failed');
        }
    }

    async copyToClipboard(calculatorType) {
        try {
            const data = this.getCalculationData(calculatorType);
            
            let text = `🏗️ CostFlowAI ${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Estimate\n`;
            text += `Generated: ${new Date(data.timestamp).toLocaleDateString()}\n\n`;
            
            text += `📝 Project Inputs:\n`;
            Object.entries(data.inputs).forEach(([key, value]) => {
                text += `• ${this.formatLabel(key)}: ${value}\n`;
            });
            
            text += `\n📊 Results:\n`;
            Object.entries(data.results).forEach(([key, value]) => {
                text += `• ${key}: ${value}\n`;
            });
            
            text += `\n---\nGenerated by CostFlowAI - costflowai.com`;
            
            await navigator.clipboard.writeText(text);
            this.showExportSuccess('Copy', 'Results copied to clipboard');
            
        } catch (error) {
            console.error('Copy error:', error);
            this.showExportError('Copy to clipboard failed');
        }
    }

    saveCalculation(calculatorType) {
        try {
            const data = this.getCalculationData(calculatorType);
            
            // Save to localStorage
            const savedCalculations = JSON.parse(localStorage.getItem('costflowai_saved') || '[]');
            savedCalculations.push({
                ...data,
                id: new Date().getTime(),
                name: `${calculatorType} calculation ${new Date().toLocaleDateString()}`
            });
            
            localStorage.setItem('costflowai_saved', JSON.stringify(savedCalculations));
            this.showExportSuccess('Save', 'Calculation saved successfully');
            
        } catch (error) {
            console.error('Save error:', error);
            this.showExportError('Save failed');
        }
    }

    printResults() {
        try {
            const calculatorType = this.detectCalculatorType();
            const data = this.getCalculationData(calculatorType);
            const printContent = this.generatePDFContent(data);
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
            
        } catch (error) {
            console.error('Print error:', error);
            this.showExportError('Print failed');
        }
    }

    emailResults(calculatorType) {
        try {
            const data = this.getCalculationData(calculatorType);
            
            const subject = `CostFlowAI ${calculatorType.charAt(0).toUpperCase() + calculatorType.slice(1)} Estimate`;
            let body = `CostFlowAI Construction Estimate\n\n`;
            body += `Project Type: ${calculatorType.charAt(0).toUpperCase() + calculatorType.slice(1)}\n`;
            body += `Generated: ${new Date(data.timestamp).toLocaleDateString()}\n\n`;
            
            body += `Project Inputs:\n`;
            Object.entries(data.inputs).forEach(([key, value]) => {
                body += `• ${this.formatLabel(key)}: ${value}\n`;
            });
            
            body += `\nResults:\n`;
            Object.entries(data.results).forEach(([key, value]) => {
                body += `• ${key}: ${value}\n`;
            });
            
            body += `\n---\nGenerated by CostFlowAI\nVisit: costflowai.com`;
            
            const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;
            
        } catch (error) {
            console.error('Email error:', error);
            this.showExportError('Email failed');
        }
    }

    formatLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ')
            .replace(/-/g, ' ')
            .trim();
    }

    showExportSuccess(action, message) {
        this.showNotification(`✅ ${action} Success`, message, 'success');
    }

    showExportError(message) {
        this.showNotification('❌ Export Error', message, 'error');
    }

    showNotification(title, message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `export-notification ${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                font-size: 14px;
            ">
                <div style="font-weight: 600; margin-bottom: 5px;">${title}</div>
                <div>${message}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 5000);
    }
}

// Initialize export manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.exportManager = new ExportManager();
    console.log('📤 Export functionality loaded');
});

// Export for debugging
window.ExportManager = ExportManager;