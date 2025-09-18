/**
 * Export utilities: CSV, PDF, Print. These helpers avoid third-party
 * dependencies and operate with progressive enhancement – they no-op during
 * server-side rendering or unit tests.
 */

function guardWindow(action) {
  if (typeof window === 'undefined') return null;
  return action(window);
}

export function toCSV(calculation) {
  if (!calculation) return '';
  const rows = [['Field', 'Value']];
  Object.entries(calculation.inputs || {}).forEach(([key, value]) => {
    rows.push([`Input: ${key}`, value]);
  });
  Object.entries(calculation.results || {}).forEach(([key, value]) => {
    rows.push([`Result: ${key}`, value]);
  });
  return rows.map(row => row.map(String).map(item => `"${item.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function downloadCSV(calculation) {
  return guardWindow(() => {
    const csv = toCSV(calculation);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${calculation?.type || 'calculator'}-results.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function buildPrintableHtml(calculation) {
  const resultRows = Object.entries(calculation.results || {}).map(([key, value]) => {
    return `<tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ccc;">${key}</th><td style="padding:8px;border-bottom:1px solid #ccc;">${value}</td></tr>`;
  }).join('');
  const inputRows = Object.entries(calculation.inputs || {}).map(([key, value]) => {
    return `<tr><th style="text-align:left;padding:8px;border-bottom:1px solid #eee;">${key}</th><td style="padding:8px;border-bottom:1px solid #eee;">${value}</td></tr>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${calculation.title || 'Calculator Results'}</title></head><body style="font-family:system-ui,sans-serif;padding:32px;max-width:720px;margin:0 auto;">
    <h1>${calculation.title || 'Calculator Results'}</h1>
    <p><strong>Generated:</strong> ${new Date(calculation.timestamp || Date.now()).toLocaleString()}</p>
    <h2>Inputs</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${inputRows}</table>
    <h2>Results</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${resultRows}</table>
    <p style="font-size:0.85rem;color:#555;">ROM estimate only. Verify with a licensed contractor before purchasing materials.</p>
  </body></html>`;
}

export function downloadPDF(calculation) {
  return guardWindow(() => {
    const printable = buildPrintableHtml(calculation);
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!reportWindow) return;
    reportWindow.document.write(printable);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  });
}

export function triggerPrint(calculation) {
  return guardWindow(() => {
    const printable = buildPrintableHtml(calculation);
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!reportWindow) return;
    reportWindow.document.write(printable);
    reportWindow.document.close();
    reportWindow.focus();
  });
}

export function copySummary(calculation) {
  return guardWindow(() => {
    const textLines = [`${calculation.title}`, ''];
    Object.entries(calculation.results || {}).forEach(([key, value]) => {
      textLines.push(`${key}: ${value}`);
    });
    const text = textLines.join('\n');
    navigator.clipboard?.writeText(text).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  });
}

export default {
  toCSV,
  downloadCSV,
  downloadPDF,
  triggerPrint,
  copySummary
};
