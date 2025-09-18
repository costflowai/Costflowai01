export class jsPDF {
  constructor() {
    this._lines = [];
  }

  text(content, x = 10, y = 10) {
    this._lines.push(`${x},${y}: ${content}`);
  }

  save(filename) {
    const header = "%PDF-1.3\n";
    const body = this._lines.join("\n");
    const trailer = "\n%%EOF";
    const blob = new Blob([header, body, trailer], { type: "application/pdf" });
    this._download(blob, filename);
  }

  _download(blob, filename) {
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
}
