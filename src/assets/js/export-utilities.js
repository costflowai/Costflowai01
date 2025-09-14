/**
 * CostFlowAI Export Utilities
 * Handles CSV export, print, copy, and email functionality
 */

(function(window) {
    'use strict';

    const ExportUtils = {
        // Export to CSV
        exportCSV: function(data, filename = 'calculation.csv') {
            const { title, type, timestamp, inputs, results } = data;
            
            let csv = 'CostFlowAI Calculator Export\n';
            csv += `Title,${title}\n`;
            csv += `Type,${type}\n`;
            csv += `Timestamp,${timestamp || new Date().toISOString()}\n\n`;
            
            // Inputs section
            csv += 'INPUTS\n';
            csv += 'Parameter,Value,Unit\n';
            for (const [key, value] of Object.entries(inputs || {})) {
                const label = this.formatLabel(key);
                const unit = value.unit || '';
                const val = value.value || value;
                csv += `"${label}","${val}","${unit}"\n`;
            }
            
            // Results section
            csv += '\nRESULTS\n';
            csv += 'Metric,Value,Unit\n';
            for (const [key, value] of Object.entries(results || {})) {
                const label = this.formatLabel(key);
                const unit = value.unit || '';
                const val = value.value || value;
                csv += `"${label}","${val}","${unit}"\n`;
            }
            
            // Create and download file
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            return true;
        },

        // Copy to clipboard
        copyToClipboard: function(data) {
            const { title, type, inputs, results } = data;
            
            let text = `${title}\n`;
            text += `Calculator: ${type}\n`;
            text += `Date: ${new Date().toLocaleString()}\n\n`;
            
            text += 'INPUTS:\n';
            for (const [key, value] of Object.entries(inputs || {})) {
                const label = this.formatLabel(key);
                const val = value.value || value;
                const unit = value.unit || '';
                text += `  ${label}: ${val} ${unit}\n`;
            }
            
            text += '\nRESULTS:\n';
            for (const [key, value] of Object.entries(results || {})) {
                const label = this.formatLabel(key);
                const val = value.value || value;
                const unit = value.unit || '';
                text += `  ${label}: ${val} ${unit}\n`;
            }
            
            // Try modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                return navigator.clipboard.writeText(text).then(() => {
                    this.showNotification('Copied to clipboard!');
                    return true;
                }).catch(() => {
                    return this.fallbackCopy(text);
                });
            } else {
                return this.fallbackCopy(text);
            }
        },

        // Fallback copy method
        fallbackCopy: function(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                this.showNotification('Copied to clipboard!');
                return true;
            } catch (err) {
                this.showNotification('Copy failed', 'error');
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        },

        // Print calculation
        print: function(data) {
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            const html = this.generatePrintHTML(data);
            
            printWindow.document.write(html);
            printWindow.document.close();
            
            printWindow.onload = function() {
                printWindow.print();
            };
            
            return true;
        },

        // Generate print HTML
        generatePrintHTML: function(data) {
            const { title, type, timestamp, inputs, results } = data;
            
            return `
<!DOCTYPE html>
<html>
<head>
    <title>${title} - CostFlowAI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            line-height: 1.6; 
        }
        .header { 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        h1 { color: #1e3a5f; margin-bottom: 10px; }
        .section { margin-bottom: 30px; }
        h2 { 
            color: #333; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 10px; 
            margin-bottom: 15px; 
        }
        .item { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px dotted #ccc; 
        }
        .label { font-weight: 600; }
        .value { color: #333; }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ccc; 
            text-align: center; 
            color: #666; 
        }
        @media print { 
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Calculator: ${type}</p>
        <p>Date: ${timestamp || new Date().toLocaleString()}</p>
    </div>
    
    <div class="section">
        <h2>Project Inputs</h2>
        ${Object.entries(inputs || {}).map(([key, value]) => `
            <div class="item">
                <span class="label">${this.formatLabel(key)}:</span>
                <span class="value">${value.value || value} ${value.unit || ''}</span>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Calculation Results</h2>
        ${Object.entries(results || {}).map(([key, value]) => `
            <div class="item">
                <span class="label">${this.formatLabel(key)}:</span>
                <span class="value">${value.value || value} ${value.unit || ''}</span>
            </div>
        `).join('')}
    </div>
    
    <div class="footer">
        <p>Generated by CostFlowAI Professional Calculators</p>
        <p>costflowai.com</p>
    </div>
</body>
</html>`;
        },

        // Email calculation (mailto)
        email: function(data) {
            const { title, type, inputs, results } = data;
            
            const subject = encodeURIComponent(`${title} - CostFlowAI Calculation`);
            
            let body = `${title}\n`;
            body += `Calculator: ${type}\n`;
            body += `Date: ${new Date().toLocaleString()}\n\n`;
            
            body += 'PROJECT INPUTS:\n';
            for (const [key, value] of Object.entries(inputs || {})) {
                const label = this.formatLabel(key);
                const val = value.value || value;
                const unit = value.unit || '';
                body += `  ${label}: ${val} ${unit}\n`;
            }
            
            body += '\nCALCULATION RESULTS:\n';
            for (const [key, value] of Object.entries(results || {})) {
                const label = this.formatLabel(key);
                const val = value.value || value;
                const unit = value.unit || '';
                body += `  ${label}: ${val} ${unit}\n`;
            }
            
            body += '\n---\n';
            body += 'Calculation Data (JSON):\n';
            body += JSON.stringify(data, null, 2);
            
            const mailto = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;
            
            return true;
        },

        // Format label from key
        formatLabel: function(key) {
            return key
                .replace(/([A-Z])/g, ' $1')
                .replace(/[_-]/g, ' ')
                .replace(/^./, str => str.toUpperCase())
                .trim();
        },

        // Show notification
        showNotification: function(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `export-notification ${type}`;
            notification.textContent = message;
            
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                info: '#3b82f6'
            };
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type] || colors.info};
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    };

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Export to window
    window.ExportUtils = ExportUtils;

})(window);