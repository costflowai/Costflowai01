/**
 * Export Utilities - PDF, CSV, and Copy functionality for calculator results
 */

/**
 * Copy calculation results to clipboard
 */
export async function copyText() {
  if (!window.lastCalculation) {
    alert('No calculation results to copy. Please calculate first.');
    return;
  }
  
  const { title, inputs, results, timestamp } = window.lastCalculation;
  
  const text = formatResultsAsText(title, inputs, results, timestamp);
  
  try {
    await navigator.clipboard.writeText(text);
    showFeedback('Results copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    // Fallback for older browsers
    fallbackCopyText(text);
  }
}

/**
 * Download calculation results as CSV
 */
export function downloadCSV() {
  if (!window.lastCalculation) {
    alert('No calculation results to export. Please calculate first.');
    return;
  }
  
  const { title, inputs, results, timestamp } = window.lastCalculation;
  
  const csv = formatResultsAsCSV(title, inputs, results, timestamp);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFilename(title)}_${formatDateForFilename(timestamp)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showFeedback('CSV downloaded successfully!', 'success');
}

/**
 * Download calculation results as PDF
 */
export function downloadPDF() {
  if (!window.lastCalculation) {
    alert('No calculation results to export. Please calculate first.');
    return;
  }
  
  // Check if jsPDF is available
  if (typeof window.jsPDF === 'undefined') {
    console.error('jsPDF library not loaded');
    alert('PDF export is currently unavailable. Please try again later.');
    return;
  }
  
  const { title, inputs, results, timestamp } = window.lastCalculation;
  
  try {
    const doc = new window.jsPDF();
    generatePDFContent(doc, title, inputs, results, timestamp);
    
    const filename = `${sanitizeFilename(title)}_${formatDateForFilename(timestamp)}.pdf`;
    doc.save(filename);
    
    showFeedback('PDF downloaded successfully!', 'success');
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('PDF export failed. Please try again.');
  }
}

/**
 * Format results as plain text
 */
function formatResultsAsText(title, inputs, results, timestamp) {
  let text = `${title}\n`;
  text += `Generated: ${new Date(timestamp).toLocaleString()}\n`;
  text += `Source: CostFlowAI.com\n\n`;
  
  text += `INPUTS:\n`;
  Object.entries(inputs).forEach(([key, value]) => {
    const label = formatLabel(key);
    text += `${label}: ${formatValue(value)}\n`;
  });
  
  text += `\nRESULTS:\n`;
  Object.entries(results).forEach(([key, value]) => {
    if (key !== 'breakdown' && typeof value !== 'object') {
      const label = formatLabel(key);
      text += `${label}: ${formatValue(value)}\n`;
    }
  });
  
  // Add breakdown if available
  if (results.breakdown) {
    text += `\nBREAKDOWN:\n`;
    Object.entries(results.breakdown).forEach(([key, value]) => {
      const label = formatLabel(key);
      text += `${label}: ${formatValue(value)}\n`;
    });
  }
  
  return text;
}

/**
 * Format results as CSV
 */
function formatResultsAsCSV(title, inputs, results, timestamp) {
  let csv = `"Category","Item","Value"\n`;
  csv += `"Report","Title","${title}"\n`;
  csv += `"Report","Generated","${new Date(timestamp).toLocaleString()}"\n`;
  csv += `"Report","Source","CostFlowAI.com"\n`;
  
  // Add inputs
  Object.entries(inputs).forEach(([key, value]) => {
    const label = formatLabel(key);
    csv += `"Input","${label}","${formatValue(value)}"\n`;
  });
  
  // Add results
  Object.entries(results).forEach(([key, value]) => {
    if (key !== 'breakdown' && typeof value !== 'object') {
      const label = formatLabel(key);
      csv += `"Result","${label}","${formatValue(value)}"\n`;
    }
  });
  
  // Add breakdown
  if (results.breakdown) {
    Object.entries(results.breakdown).forEach(([key, value]) => {
      const label = formatLabel(key);
      csv += `"Breakdown","${label}","${formatValue(value)}"\n`;
    });
  }
  
  return csv;
}

/**
 * Generate PDF content
 */
function generatePDFContent(doc, title, inputs, results, timestamp) {
  let yPos = 20;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(title, 20, yPos);
  yPos += lineHeight * 2;
  
  // Metadata
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date(timestamp).toLocaleString()}`, 20, yPos);
  yPos += lineHeight;
  doc.text('Source: CostFlowAI.com', 20, yPos);
  yPos += lineHeight * 2;
  
  // Inputs section
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('INPUTS', 20, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  Object.entries(inputs).forEach(([key, value]) => {
    const label = formatLabel(key);
    const text = `${label}: ${formatValue(value)}`;
    doc.text(text, 25, yPos);
    yPos += lineHeight;
    
    // Check for page break
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  });
  
  yPos += lineHeight;
  
  // Results section
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('RESULTS', 20, yPos);
  yPos += lineHeight;
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  Object.entries(results).forEach(([key, value]) => {
    if (key !== 'breakdown' && typeof value !== 'object') {
      const label = formatLabel(key);
      const text = `${label}: ${formatValue(value)}`;
      doc.text(text, 25, yPos);
      yPos += lineHeight;
      
      // Check for page break
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    }
  });
  
  // Breakdown section
  if (results.breakdown) {
    yPos += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DETAILED BREAKDOWN', 20, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    Object.entries(results.breakdown).forEach(([key, value]) => {
      const label = formatLabel(key);
      const text = `${label}: ${formatValue(value)}`;
      doc.text(text, 25, yPos);
      yPos += lineHeight;
      
      // Check for page break
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
  }
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, 290);
  }
}

/**
 * Format label for display
 */
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format value for display
 */
function formatValue(value) {
  if (typeof value === 'number') {
    if (value % 1 === 0) {
      return value.toLocaleString();
    } else {
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
  }
  return String(value);
}

/**
 * Sanitize filename for download
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

/**
 * Format date for filename
 */
function formatDateForFilename(timestamp) {
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Show user feedback message
 */
function showFeedback(message, type = 'info') {
  // Create or update feedback element
  let feedback = document.getElementById('export-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = 'export-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(feedback);
  }
  
  // Style based on type
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3'
  };
  
  feedback.style.backgroundColor = colors[type] || colors.info;
  feedback.textContent = message;
  feedback.style.opacity = '1';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (feedback) {
      feedback.style.opacity = '0';
      setTimeout(() => {
        if (feedback && feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }
  }, 3000);
}

/**
 * Fallback copy method for older browsers
 */
function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    showFeedback('Results copied to clipboard!', 'success');
  } catch (error) {
    showFeedback('Copy failed. Please select and copy manually.', 'error');
    console.error('Fallback copy failed:', error);
  }
  
  document.body.removeChild(textArea);
}