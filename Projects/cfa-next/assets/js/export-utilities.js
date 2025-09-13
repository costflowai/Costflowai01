/**
 * Export Utilities - Handle calculator result exports
 * Provides save, CSV export, share, print, and email functionality
 */

class ExportUtilities {
    constructor() {
        this.initEventListeners();
    }

    /**
     * Initialize event listeners for export actions
     */
    initEventListeners() {
        document.addEventListener('calculator:export', (event) => {
            const { action, section, slug, calculation } = event.detail;
            this.handleExport(action, section, slug, calculation);
        });
    }

    /**
     * Handle export action dispatch
     * @param {string} action - Export action type
     * @param {HTMLElement} section - Calculator section
     * @param {string} slug - Calculator type
     * @param {Object} calculation - Calculation data
     */
    async handleExport(action, section, slug, calculation) {
        try {
            switch (action) {
                case 'save':
                    await this.saveCalc(calculation, slug);
                    break;
                case 'export':
                    await this.exportCalc(calculation, slug);
                    break;
                case 'print':
                    await this.printCalc(calculation, slug, section);
                    break;
                case 'email':
                    await this.emailCalc(calculation, slug);
                    break;
            }
        } catch (error) {
            console.error(`Export action failed: ${action}`, error);
            this.showExportError(section, `Failed to ${action} calculation: ${error.message}`);
        }
    }

    /**
     * Save calculation to local storage
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     */
    async saveCalc(calculation, slug) {
        const savedCalculations = this.getSavedCalculations();
        const saveId = `${slug}_${Date.now()}`;

        const saveData = {
            id: saveId,
            type: slug,
            timestamp: calculation.timestamp,
            inputs: calculation.inputs,
            results: calculation.results,
            name: this.generateCalculationName(slug, calculation.inputs)
        };

        savedCalculations[saveId] = saveData;
        localStorage.setItem('saved_calculations', JSON.stringify(savedCalculations));

        this.showExportSuccess(`Calculation saved as "${saveData.name}"`);
    }

    /**
     * Export calculation as CSV
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     */
    async exportCalc(calculation, slug) {
        const csvData = this.generateCSV(calculation, slug);
        const filename = `${slug}_calculation_${new Date().toISOString().split('T')[0]}.csv`;

        this.downloadFile(csvData, filename, 'text/csv');
        this.showExportSuccess('CSV file downloaded successfully');
    }

    /**
     * Print calculation results
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     * @param {HTMLElement} section - Calculator section
     */
    async printCalc(calculation, slug, section) {
        const printContent = this.generatePrintHTML(calculation, slug, section);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();

        // Auto-print after a short delay
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);

        this.showExportSuccess('Print dialog opened');
    }

    /**
     * Share calculation via email
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     */
    async shareCalc(calculation, slug) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${this.capitalizeFirst(slug)} Calculator Results`,
                    text: this.generateShareText(calculation, slug),
                    url: window.location.href
                });
                this.showExportSuccess('Shared successfully');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    throw error;
                }
            }
        } else {
            // Fallback to copying to clipboard
            await this.copyToClipboard(this.generateShareText(calculation, slug));
            this.showExportSuccess('Results copied to clipboard');
        }
    }

    /**
     * Email calculation results
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     */
    async emailCalc(calculation, slug) {
        const subject = encodeURIComponent(`${this.capitalizeFirst(slug)} Calculator Results`);
        const body = encodeURIComponent(this.generateEmailBody(calculation, slug));

        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;

        this.showExportSuccess('Email client opened');
    }

    /**
     * Generate CSV content from calculation data
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     * @returns {string} CSV content
     */
    generateCSV(calculation, slug) {
        const lines = [];

        // Header
        lines.push(`${this.capitalizeFirst(slug)} Calculator Results`);
        lines.push(`Generated: ${new Date(calculation.timestamp).toLocaleString()}`);
        lines.push('');

        // Inputs
        lines.push('INPUTS');
        Object.entries(calculation.inputs).forEach(([key, value]) => {
            lines.push(`${this.formatLabel(key)},${value}`);
        });
        lines.push('');

        // Results
        lines.push('RESULTS');
        Object.entries(calculation.results).forEach(([key, value]) => {
            if (!key.startsWith('_')) { // Skip internal data
                lines.push(`${this.formatLabel(key)},${value}`);
            }
        });

        return lines.join('\n');
    }

    /**
     * Generate HTML content for printing
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     * @param {HTMLElement} section - Calculator section
     * @returns {string} HTML content
     */
    generatePrintHTML(calculation, slug, section) {
        const calculatorName = this.capitalizeFirst(slug);

        return `
<!DOCTYPE html>
<html>
<head>
    <title>${calculatorName} Calculator Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .section h3 { color: #333; margin-bottom: 10px; }
        .item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
        .label { font-weight: bold; }
        .value { text-align: right; }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${calculatorName} Calculator Results</h1>
        <p>Generated: ${new Date(calculation.timestamp).toLocaleString()}</p>
    </div>

    <div class="section">
        <h3>Input Values</h3>
        ${Object.entries(calculation.inputs).map(([key, value]) => `
            <div class="item">
                <span class="label">${this.formatLabel(key)}:</span>
                <span class="value">${value}</span>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h3>Results</h3>
        ${Object.entries(calculation.results).filter(([key]) => !key.startsWith('_')).map(([key, value]) => `
            <div class="item">
                <span class="label">${this.formatLabel(key)}:</span>
                <span class="value">${value}</span>
            </div>
        `).join('')}
    </div>

    <div class="section no-print">
        <p><small>Generated by CFA Calculator Suite - ${window.location.origin}</small></p>
    </div>
</body>
</html>`;
    }

    /**
     * Generate shareable text
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     * @returns {string} Share text
     */
    generateShareText(calculation, slug) {
        const lines = [];
        lines.push(`${this.capitalizeFirst(slug)} Calculator Results`);
        lines.push(`Generated: ${new Date(calculation.timestamp).toLocaleString()}`);
        lines.push('');

        // Key results only for sharing
        const keyResults = this.getKeyResults(calculation.results, slug);
        keyResults.forEach(([key, value]) => {
            lines.push(`${this.formatLabel(key)}: ${value}`);
        });

        return lines.join('\n');
    }

    /**
     * Generate email body
     * @param {Object} calculation - Calculation data
     * @param {string} slug - Calculator type
     * @returns {string} Email body
     */
    generateEmailBody(calculation, slug) {
        return `Hi,

I've calculated the ${slug} requirements for our project:

${this.generateShareText(calculation, slug)}

Best regards`;
    }

    /**
     * Get key results for sharing (most important values)
     * @param {Object} results - All results
     * @param {string} slug - Calculator type
     * @returns {Array} Key result entries
     */
    getKeyResults(results, slug) {
        const keyFields = {
            paint: ['wall_area', 'gallons', 'cost'],
            concrete: ['cubic_yards', 'cost'],
            drywall: ['sheets', 'area', 'cost']
        };

        const keys = keyFields[slug] || Object.keys(results).filter(k => !k.startsWith('_'));
        return keys.map(key => [key, results[key]]).filter(([_, value]) => value !== undefined);
    }

    /**
     * Download file to user's device
     * @param {string} content - File content
     * @param {string} filename - File name
     * @param {string} mimeType - MIME type
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    async copyToClipboard(text) {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }

    /**
     * Get saved calculations from local storage
     * @returns {Object} Saved calculations
     */
    getSavedCalculations() {
        try {
            return JSON.parse(localStorage.getItem('saved_calculations') || '{}');
        } catch {
            return {};
        }
    }

    /**
     * Generate a readable name for calculation
     * @param {string} slug - Calculator type
     * @param {Object} inputs - Input values
     * @returns {string} Generated name
     */
    generateCalculationName(slug, inputs) {
        const timestamp = new Date().toLocaleDateString();

        if (slug === 'paint' && inputs.length && inputs.width) {
            return `${slug} - ${inputs.length}x${inputs.width}ft - ${timestamp}`;
        }

        return `${this.capitalizeFirst(slug)} Calculation - ${timestamp}`;
    }

    /**
     * Format label for display
     * @param {string} key - Field key
     * @returns {string} Formatted label
     */
    formatLabel(key) {
        return key.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    /**
     * Capitalize first letter
     * @param {string} str - Input string
     * @returns {string} Capitalized string
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Show export success message
     * @param {string} message - Success message
     */
    showExportSuccess(message) {
        this.showExportMessage(message, 'success');
    }

    /**
     * Show export error message
     * @param {HTMLElement} section - Calculator section
     * @param {string} message - Error message
     */
    showExportError(section, message) {
        this.showExportMessage(message, 'error');
    }

    /**
     * Show export message (success or error)
     * @param {string} message - Message to show
     * @param {string} type - Message type ('success' or 'error')
     */
    showExportMessage(message, type) {
        // Create or update message element
        let messageEl = document.getElementById('export-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'export-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 4px;
                font-weight: 500;
                z-index: 10000;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }

        // Style based on type
        if (type === 'success') {
            messageEl.style.background = '#d4edda';
            messageEl.style.border = '1px solid #c3e6cb';
            messageEl.style.color = '#155724';
        } else {
            messageEl.style.background = '#f8d7da';
            messageEl.style.border = '1px solid #f5c6cb';
            messageEl.style.color = '#721c24';
        }

        messageEl.textContent = message;
        messageEl.style.opacity = '1';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.opacity = '0';
                setTimeout(() => {
                    if (messageEl && messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Initialize export utilities
const exportUtilities = new ExportUtilities();

// Export for global use
window.exportUtilities = exportUtilities;