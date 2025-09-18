import { jsPDF } from '../../../vendor/jspdf/index.js';
import { utils as XLSXUtils, writeFile as writeXLSXFile } from '../../../vendor/xlsx/index.js';

function triggerDownload(content, filename, type) {
  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 500);
}

export function exportCSV(rows, filename = 'export.csv') {
  const content = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  triggerDownload(content, filename, 'text/csv');
}

export function exportXLSX(rows, filename = 'export.xlsx') {
  const wb = XLSXUtils.book_new();
  const sheet = XLSXUtils.aoa_to_sheet(rows);
  XLSXUtils.book_append_sheet(wb, sheet, 'Sheet1');
  writeXLSXFile(wb, filename);
}

export function exportPDF(lines, filename = 'export.pdf') {
  const doc = new jsPDF();
  let y = 12;
  for (const line of lines) {
    doc.text(String(line), 12, y);
    y += 8;
  }
  doc.save(filename);
}

export function exportPrint() {
  window.print();
}
