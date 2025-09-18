const DEFAULT_PAGE_WIDTH = 612;
const DEFAULT_PAGE_HEIGHT = 792;

const escapePDFText = (text) => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r?\n/g, '\\n');

export class jsPDF {
  constructor() {
    this.fontSize = 12;
    this.lines = [];
  }

  setFontSize(size) {
    this.fontSize = size;
  }

  text(content, x, y) {
    this.lines.push({ type: 'text', content: String(content), x, y, fontSize: this.fontSize });
  }

  line(x1, y1, x2, y2) {
    this.lines.push({ type: 'line', x1, y1, x2, y2 });
  }

  _buildStream() {
    const chunks = ['BT'];
    let currentFont = null;
    for (const item of this.lines) {
      if (item.type === 'text') {
        if (currentFont !== item.fontSize) {
          chunks.push(`/F1 ${item.fontSize} Tf`);
          currentFont = item.fontSize;
        }
        chunks.push(`${item.x} ${DEFAULT_PAGE_HEIGHT - item.y} Td (${escapePDFText(item.content)}) Tj`);
      } else if (item.type === 'line') {
        chunks.push('ET');
        chunks.push('0.5 w');
        chunks.push(`${item.x1} ${DEFAULT_PAGE_HEIGHT - item.y1} m`);
        chunks.push(`${item.x2} ${DEFAULT_PAGE_HEIGHT - item.y2} l S`);
        chunks.push('BT');
      }
    }
    chunks.push('ET');
    return chunks.join('\n');
  }

  output(type = 'blob') {
    const stream = this._buildStream();
    const encoder = new TextEncoder();
    const streamBytes = encoder.encode(stream);
    const objects = [];

    const pushObject = (content) => {
      const text = `${objects.length + 1} 0 obj\n${content}\nendobj\n`;
      objects.push(text);
      return objects.length;
    };

    pushObject('<< /Type /Catalog /Pages 2 0 R >>');
    pushObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    pushObject('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>');
    pushObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    pushObject(`<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`);

    const header = '%PDF-1.4\n';
    const xref = [];
    let position = header.length;
    const body = objects
      .map((obj) => {
        xref.push(position.toString().padStart(10, '0') + ' 00000 n ');
        position += obj.length;
        return obj;
      })
      .join('');

    const xrefStart = position;
    const trailer = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${xref.join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const pdfBytes = encoder.encode(header + body + trailer);

    if (type === 'blob') {
      return new Blob([pdfBytes], { type: 'application/pdf' });
    }
    if (type === 'arraybuffer') {
      return pdfBytes.buffer;
    }
    if (type === 'string') {
      return header + body + trailer;
    }
    return pdfBytes;
  }

  save(filename = 'document.pdf') {
    const blob = this.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export default { jsPDF };
