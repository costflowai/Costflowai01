export const utils = {
  book_new() {
    return { Sheets: {}, SheetNames: [] };
  },
  aoa_to_sheet(data) {
    return { data };
  },
  book_append_sheet(workbook, sheet, name) {
    workbook.Sheets[name] = sheet;
    workbook.SheetNames.push(name);
  }
};

export function write(workbook) {
  const sheetName = workbook.SheetNames[0];
  const rows = workbook.Sheets[sheetName].data;
  return rows.map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function writeFile(workbook, filename) {
  const csv = write(workbook);
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
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
