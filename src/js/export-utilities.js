/**
 * CostFlowAI Export Utilities
 * Comprehensive export functionality for all calculators
 */

class ExportUtilities {
    constructor() {
        this.companyInfo = {
            name: 'CostFlowAI',
            website: 'https://costflowai.com',
            tagline: 'AI-Powered Construction Cost Estimation',
            disclaimer: 'Estimates are for planning purposes only. Actual costs may vary.'
        };
    }

    /**
     * Export data to CSV format
     */
    exportToCSV(data, filename = 'costflowai-export') {
        try {
            let csv = this.convertToCSV(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}-${this.getTimestamp()}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.trackExport('csv', filename);
            return true;
        } catch (error) {
            console.error('CSV export failed:', error);
            this.showToast('CSV export failed. Please try again.', 'error');
            return false;
        }
    }

    /**
     * Convert data object to CSV string
     */
    convertToCSV(data) {
        let csv = [];
        
        // Add header
        csv.push(`"${this.companyInfo.name} - ${data.title || 'Cost Estimate'}"`);
        csv.push(`"Generated: ${new Date().toLocaleString()}"`);
        csv.push(`""`); // Empty row
        
        // Add project info if available
        if (data.projectInfo) {
            csv.push('"Project Information"');
            Object.entries(data.projectInfo).forEach(([key, value]) => {
                csv.push(`"${this.formatLabel(key)}","${value}"`);
            });
            csv.push('');
        }
        
        // Add cost breakdown
        if (data.breakdown) {
            csv.push('"Cost Breakdown"');
            csv.push('"Item","Quantity","Unit","Unit Cost","Total Cost"');
            data.breakdown.forEach(item => {
                csv.push(`"${item.name}","${item.quantity || ''}","${item.unit || ''}","${this.formatCurrency(item.unitCost)}","${this.formatCurrency(item.total)}"`);
            });
            csv.push('');
        }
        
        // Add summary
        if (data.summary) {
            csv.push('"Summary"');
            Object.entries(data.summary).forEach(([key, value]) => {
                csv.push(`"${this.formatLabel(key)}","${this.formatValue(value)}"`);
            });
        }
        
        // Add disclaimer
        csv.push('');
        csv.push(`"${this.companyInfo.disclaimer}"`);
        
        return csv.join('\n');
    }

    /**
     * Export data to PDF format
     */
    async exportToPDF(data, filename = 'costflowai-estimate') {
        try {
            // Check if jsPDF is loaded and load if necessary
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                await this.loadJsPDF();
            }
            
            // Get jsPDF constructor from different possible locations
            let jsPDF;
            if (window.jspdf && window.jspdf.jsPDF) {
                jsPDF = window.jspdf.jsPDF;
            } else if (window.jsPDF) {
                jsPDF = window.jsPDF;
            } else if (window.jspdf) {
                jsPDF = window.jspdf;
            } else {
                throw new Error('jsPDF library not available');
            }
            
            const doc = new jsPDF();
            
            // Set fonts and colors
            const primaryColor = [102, 126, 234];
            const textColor = [55, 65, 81];
            
            // Add header
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 210, 30, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.text(this.companyInfo.name, 20, 15);
            doc.setFontSize(10);
            doc.text(this.companyInfo.tagline, 20, 22);
            
            // Reset text color
            doc.setTextColor(...textColor);
            
            // Add title
            doc.setFontSize(16);
            doc.text(data.title || 'Cost Estimate Report', 20, 45);
            
            // Add generation date
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 52);
            
            let yPosition = 65;
            
            // Add project information
            if (data.projectInfo) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Project Information', 20, yPosition);
                doc.setFont(undefined, 'normal');
                yPosition += 7;
                
                doc.setFontSize(10);
                Object.entries(data.projectInfo).forEach(([key, value]) => {
                    doc.text(`${this.formatLabel(key)}: ${value}`, 25, yPosition);
                    yPosition += 6;
                });
                yPosition += 5;
            }
            
            // Add cost breakdown table
            if (data.breakdown && data.breakdown.length > 0) {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Cost Breakdown', 20, yPosition);
                doc.setFont(undefined, 'normal');
                yPosition += 7;
                
                // Table headers
                const headers = [['Item', 'Quantity', 'Unit', 'Unit Cost', 'Total']];
                const rows = data.breakdown.map(item => [
                    item.name,
                    item.quantity || '-',
                    item.unit || '-',
                    this.formatCurrency(item.unitCost),
                    this.formatCurrency(item.total)
                ]);
                
                doc.autoTable({
                    head: headers,
                    body: rows,
                    startY: yPosition,
                    theme: 'striped',
                    headStyles: { fillColor: primaryColor },
                    margin: { left: 20, right: 20 }
                });
                
                yPosition = doc.lastAutoTable.finalY + 10;
            }
            
            // Add summary
            if (data.summary) {
                // Check if we need a new page
                if (yPosition > 240) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Summary', 20, yPosition);
                doc.setFont(undefined, 'normal');
                yPosition += 7;
                
                doc.setFontSize(10);
                Object.entries(data.summary).forEach(([key, value]) => {
                    doc.text(`${this.formatLabel(key)}: ${this.formatValue(value)}`, 25, yPosition);
                    yPosition += 6;
                });
            }
            
            // Add footer
            doc.setFontSize(8);
            doc.setTextColor(107, 114, 128);
            doc.text(this.companyInfo.disclaimer, 20, 280);
            doc.text(this.companyInfo.website, 20, 285);
            
            // Save the PDF
            doc.save(`${filename}-${this.getTimestamp()}.pdf`);
            
            this.trackExport('pdf', filename);
            return true;
        } catch (error) {
            console.error('PDF export failed:', error);
            this.showToast('PDF export failed. Please try again.', 'error');
            return false;
        }
    }

    /**
     * Load jsPDF library dynamically
     */
    loadJsPDF() {
        return new Promise((resolve, reject) => {
            // Check if jsPDF is already loaded in any form
            if (window.jspdf || window.jsPDF || (window.jspdf && window.jspdf.jsPDF)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                // Give jsPDF time to initialize
                setTimeout(() => {
                    if (window.jspdf || window.jsPDF) {
                        // Try to load autoTable plugin
                        try {
                            const tableScript = document.createElement('script');
                            tableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
                            tableScript.onload = () => {
                                setTimeout(resolve, 100); // Give plugin time to initialize
                            };
                            tableScript.onerror = () => {
                                console.warn('jsPDF autotable plugin failed to load, continuing without it');
                                resolve(); // Continue without plugin
                            };
                            document.head.appendChild(tableScript);
                        } catch (pluginError) {
                            console.warn('Error loading jsPDF plugin:', pluginError);
                            resolve(); // Continue without plugin
                        }
                    } else {
                        reject(new Error('jsPDF failed to initialize'));
                    }
                }, 200);
            };
            script.onerror = () => reject(new Error('Failed to load jsPDF library'));
            document.head.appendChild(script);
        });
    }

    /**
     * Copy data to clipboard
     */
    copyToClipboard(data) {
        try {
            let text = this.formatForClipboard(data);
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showToast('Copied to clipboard!');
                });
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showToast('Copied to clipboard!');
            }
            
            this.trackExport('clipboard', data.title);
            return true;
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            this.showToast('Copy to clipboard failed. Please copy manually.', 'error');
            return false;
        }
    }

    /**
     * Format data for clipboard
     */
    formatForClipboard(data) {
        let text = [];
        
        text.push(`${this.companyInfo.name} - ${data.title || 'Cost Estimate'}`);
        text.push(`Generated: ${new Date().toLocaleString()}`);
        text.push('');
        
        if (data.projectInfo) {
            text.push('PROJECT INFORMATION');
            Object.entries(data.projectInfo).forEach(([key, value]) => {
                text.push(`${this.formatLabel(key)}: ${value}`);
            });
            text.push('');
        }
        
        if (data.breakdown) {
            text.push('COST BREAKDOWN');
            data.breakdown.forEach(item => {
                text.push(`• ${item.name}: ${this.formatCurrency(item.total)}`);
            });
            text.push('');
        }
        
        if (data.summary) {
            text.push('SUMMARY');
            Object.entries(data.summary).forEach(([key, value]) => {
                text.push(`${this.formatLabel(key)}: ${this.formatValue(value)}`);
            });
        }
        
        return text.join('\n');
    }

    /**
     * Save data as JSON
     */
    saveAsJSON(data, filename = 'costflowai-data') {
        try {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}-${this.getTimestamp()}.json`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.trackExport('json', filename);
            return true;
        } catch (error) {
            console.error('JSON export failed:', error);
            return false;
        }
    }

    /**
     * Format currency value
     */
    formatCurrency(value) {
        if (typeof value === 'number') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }
        return value;
    }

    /**
     * Format label from camelCase or snake_case
     */
    formatLabel(str) {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    }

    /**
     * Format value based on type
     */
    formatValue(value) {
        if (typeof value === 'number') {
            if (value > 1000) {
                return this.formatCurrency(value);
            }
            return value.toLocaleString();
        }
        return value;
    }

    /**
     * Get timestamp for filenames
     */
    getTimestamp() {
        const now = new Date();
        return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'success', duration = 3000) {
        const existingToast = document.getElementById('export-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const toast = document.createElement('div');
        toast.id = 'export-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${colors[type] || colors.success};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 300);
            }
        }, duration);
    }

    /**
     * Track export events
     */
    trackExport(type, filename) {
        if (window.gtag) {
            window.gtag('event', 'export', {
                export_type: type,
                export_file: filename,
                page: window.location.pathname
            });
        }
    }
}

// Create global instance
window.exportUtils = new ExportUtilities();

// Add animation styles
if (!document.getElementById('export-animations')) {
    const style = document.createElement('style');
    style.id = 'export-animations';
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
}