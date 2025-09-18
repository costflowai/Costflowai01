import { jsPDF } from '/vendor/jspdf.umd.min.js';

const calculators = {
  concrete: {
    label: 'Concrete',
    fields: ['length', 'width', 'thickness', 'waste', 'unit-system'],
    compute: ({ length, width, thickness, waste, unitSystem }) => {
      if (length <= 0 || width <= 0 || thickness <= 0) {
        return { summary: [], details: [], math: 'Enter positive values to compute concrete volume.' };
      }

      const imperial = unitSystem === 'imperial';
      const lengthFeet = imperial ? length : length * 3.28084;
      const widthFeet = imperial ? width : width * 3.28084;
      const thicknessFeet = imperial ? thickness / 12 : (thickness / 100) * 3.28084;

      const volumeCubicFeet = lengthFeet * widthFeet * thicknessFeet;
      const baseCubicYards = volumeCubicFeet / 27;
      const adjustedCubicYards = baseCubicYards * (1 + waste / 100);
      const cubicMeters = adjustedCubicYards / 1.30795;
      const bags80lb = adjustedCubicYards * 27 / 0.6;
      const readyMixTrucks = adjustedCubicYards / 10;

      const math = [
        `Volume (ft³) = ${lengthFeet.toFixed(2)} × ${widthFeet.toFixed(2)} × ${thicknessFeet.toFixed(3)} = ${volumeCubicFeet.toFixed(2)} ft³`,
        `Convert to cubic yards: ${volumeCubicFeet.toFixed(2)} ÷ 27 = ${baseCubicYards.toFixed(2)} yd³`,
        `Waste factor: ${baseCubicYards.toFixed(2)} × (1 + ${waste.toFixed(1)}%) = ${adjustedCubicYards.toFixed(2)} yd³`
      ].join('\n');

      return {
        summary: [
          { label: 'Concrete Volume', value: `${adjustedCubicYards.toFixed(2)} cubic yards` },
          { label: 'Metric Volume', value: `${cubicMeters.toFixed(2)} cubic meters` },
          { label: '80 lb Bags', value: `${Math.ceil(bags80lb).toLocaleString('en-US')}` },
          { label: 'Ready-Mix Trucks (10 yd³)', value: `${Math.max(1, Math.ceil(readyMixTrucks)).toLocaleString('en-US')}` }
        ],
        details: [
          { label: 'Base Volume (yd³)', value: baseCubicYards.toFixed(2) },
          { label: 'Waste Applied (yd³)', value: adjustedCubicYards.toFixed(2) },
          { label: 'Volume (m³)', value: cubicMeters.toFixed(2) }
        ],
        math
      };
    }
  },
  framing: {
    label: 'Framing',
    fields: ['wall-length', 'wall-height', 'stud-spacing', 'plates', 'unit-system'],
    compute: ({ wallLength, wallHeight, studSpacing, plates, unitSystem }) => {
      if (wallLength <= 0 || wallHeight <= 0 || studSpacing <= 0) {
        return { summary: [], details: [], math: 'Enter positive values to compute framing materials.' };
      }

      const imperial = unitSystem === 'imperial';
      const lengthFeet = imperial ? wallLength : wallLength * 3.28084;
      const heightFeet = imperial ? wallHeight : wallHeight * 3.28084;
      const spacingInches = imperial ? studSpacing : studSpacing / 2.54;

      const studs = Math.ceil((lengthFeet * 12) / spacingInches) + 1;
      const platesCount = Math.max(2, plates);
      const plateFeet = lengthFeet * platesCount;
      const totalBoardFeet = studs * heightFeet + plateFeet;
      const sheathingSqFt = lengthFeet * heightFeet;
      const sheathingSqM = sheathingSqFt / 10.7639;

      const math = [
        `Stud count = ceil((${lengthFeet.toFixed(2)} ft × 12 in) ÷ ${spacingInches.toFixed(1)} in) + 1 = ${studs}`,
        `Plate length = ${lengthFeet.toFixed(2)} ft × ${platesCount} plates = ${plateFeet.toFixed(2)} ft`,
        `Board feet = (${studs} studs × ${heightFeet.toFixed(2)} ft) + ${plateFeet.toFixed(2)} ft = ${totalBoardFeet.toFixed(2)} board ft`
      ].join('\n');

      return {
        summary: [
          { label: 'Studs Required', value: `${studs}` },
          { label: 'Board Feet', value: `${totalBoardFeet.toFixed(2)}` },
          { label: 'Plates (linear ft)', value: `${plateFeet.toFixed(2)}` },
          { label: 'Sheathing Area', value: `${sheathingSqFt.toFixed(2)} ft² (${sheathingSqM.toFixed(2)} m²)` }
        ],
        details: [
          { label: 'Wall Height (ft)', value: heightFeet.toFixed(2) },
          { label: 'Spacing (in)', value: spacingInches.toFixed(2) },
          { label: 'Plates Count', value: platesCount.toString() }
        ],
        math
      };
    }
  }
};

const parseValue = (form, name) => {
  const element = form.querySelector(`[name="${name}"]`);
  if (!element) return 0;
  const value = Number.parseFloat(element.value);
  return Number.isFinite(value) ? value : 0;
};

const gatherInputs = (calculatorId, form) => {
  if (calculatorId === 'concrete') {
    return {
      length: parseValue(form, 'length'),
      width: parseValue(form, 'width'),
      thickness: parseValue(form, 'thickness'),
      waste: parseValue(form, 'waste'),
      unitSystem: form.querySelector('[name="unit-system"]').value
    };
  }

  return {
    wallLength: parseValue(form, 'wall-length'),
    wallHeight: parseValue(form, 'wall-height'),
    studSpacing: parseValue(form, 'stud-spacing'),
    plates: parseValue(form, 'plates'),
    unitSystem: form.querySelector('[name="unit-system"]').value
  };
};

const renderResults = (calculatorId, result) => {
  const container = document.querySelector(`[data-results="${calculatorId}"]`);
  if (!container) return;

  const summaryList = container.querySelector('[data-summary]');
  const detailsList = container.querySelector('[data-details]');
  const mathBlock = container.querySelector('[data-math]');

  if (!result.summary.length) {
    container.classList.add('hidden');
    summaryList.innerHTML = '';
    detailsList.innerHTML = '';
    mathBlock.textContent = result.math;
    const toggleButton = container.querySelector(`[data-action="show-math"][data-target="${calculatorId}"]`);
    if (toggleButton) {
      toggleButton.textContent = 'Show Math';
    }
    return;
  }

  const buildRow = ({ label, value }) => `<tr><th scope="row">${label}</th><td>${value}</td></tr>`;

  summaryList.innerHTML = result.summary.map(buildRow).join('');
  detailsList.innerHTML = result.details.map(buildRow).join('');
  mathBlock.textContent = result.math;
  mathBlock.classList.add('hidden');
  const toggleButton = container.querySelector(`[data-action="show-math"][data-target="${calculatorId}"]`);
  if (toggleButton) {
    toggleButton.textContent = 'Show Math';
  }
  container.classList.remove('hidden');
};

const exportCsv = (calculatorId) => {
  const container = document.querySelector(`[data-results="${calculatorId}"]`);
  if (!container || container.classList.contains('hidden')) return;

  const rows = [...container.querySelectorAll('table tr')]
    .map((row) => [...row.children].map((cell) => `"${cell.textContent.replace(/"/g, '""')}"`).join(','));
  const csv = ['"Metric","Value"', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${calculatorId}-summary.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

const exportPdf = (calculatorId) => {
  const container = document.querySelector(`[data-results="${calculatorId}"]`);
  if (!container || container.classList.contains('hidden')) return;

  const doc = new jsPDF();
  let cursorY = 760;
  const addLine = (text, size = 14) => {
    doc.text(text, 72, cursorY, { size });
    cursorY -= size * 1.4;
  };

  addLine(`${calculators[calculatorId].label} Calculator Summary`, 16);

  container.querySelectorAll('table tr').forEach((row) => {
    const cells = [...row.children].map((cell) => cell.textContent.trim());
    addLine(`${cells[0]}: ${cells[1]}`, 12);
  });

  addLine('---', 12);
  container.querySelector('[data-math]').textContent.split('\n').forEach((line) => addLine(line, 11));

  doc.save(`${calculatorId}-summary.pdf`);
};

const printResults = (calculatorId) => {
  const container = document.querySelector(`[data-results="${calculatorId}"]`);
  if (!container || container.classList.contains('hidden')) return;

  const printWindow = window.open('', '_blank', 'noopener,width=600,height=800');
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html><title>${calculators[calculatorId].label} Calculator</title>`);
  printWindow.document.write('<link rel="stylesheet" href="/assets/css/main.css">');
  printWindow.document.write(container.outerHTML);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const toggleMath = (calculatorId) => {
  const container = document.querySelector(`[data-results="${calculatorId}"]`);
  if (!container) return;
  const mathBlock = container.querySelector('[data-math]');
  mathBlock.classList.toggle('hidden');
  const toggleButton = container.querySelector(`[data-action="show-math"][data-target="${calculatorId}"]`);
  if (toggleButton) {
    toggleButton.textContent = mathBlock.classList.contains('hidden') ? 'Show Math' : 'Hide Math';
  }
};

const compute = (calculatorId) => {
  const form = document.querySelector(`[data-calculator="${calculatorId}"]`);
  if (!form) return;
  const inputs = gatherInputs(calculatorId, form);
  const result = calculators[calculatorId].compute(inputs);
  renderResults(calculatorId, result);
};

window.compute = compute;

const attachHandlers = () => {
  document.querySelectorAll('[data-calculator]').forEach((form) => {
    const calculatorId = form.getAttribute('data-calculator');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      compute(calculatorId);
    });
  });

  document.querySelectorAll('[data-action="calculate"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const calculatorId = button.getAttribute('data-target');
      compute(calculatorId);
    });
  });

  document.querySelectorAll('[data-action="show-math"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      toggleMath(button.getAttribute('data-target'));
    });
  });

  document.querySelectorAll('[data-action="export-csv"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      exportCsv(button.getAttribute('data-target'));
    });
  });

  document.querySelectorAll('[data-action="export-pdf"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      exportPdf(button.getAttribute('data-target'));
    });
  });

  document.querySelectorAll('[data-action="print"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      printResults(button.getAttribute('data-target'));
    });
  });
};

window.addEventListener('DOMContentLoaded', attachHandlers);

export { compute };
