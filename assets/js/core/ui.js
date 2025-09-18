import { validate } from './validate.js';
import { announce, focusErrorSummary } from './a11y.js';
import { rememberInputs, recallInputs } from './store.js';
import { exportCSV, exportPDF, exportPrint, exportXLSX } from './export.js';

function markdownToHtml(markdown) {
  if (!markdown) return '';
  return markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .split('\n')
    .map((line) => `<p>${line}</p>`)
    .join('');
}

function renderCostTable(table) {
  const rows = table.map((row) => `<tr><th scope="row">${row.label}</th><td>${row.value}</td></tr>`).join('');
  return `<table class="table"><thead><tr><th scope="col">Line Item</th><th scope="col">Amount</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function bindCalculator(root, calculator) {
  const form = root.querySelector('form');
  const resultsPanel = root.querySelector('.calculator-results');
  const liveRegion = root.querySelector('.results-live-region');
  const errorSummary = root.querySelector('.error-summary');
  const calculateBtn = form.querySelector('[data-action="calculate"]');
  const exportButtons = resultsPanel.querySelectorAll('[data-export]');
  const showMathBtn = resultsPanel.querySelector('[data-action="show-math"]');
  const showMathPanel = resultsPanel.querySelector('[data-panel="show-math"]');
  const calculatorId = calculator.id;

  const defaults = { ...(calculator.defaults ?? {}), ...recallInputs(calculatorId) };
  for (const [name, value] of Object.entries(defaults)) {
    const field = form.elements.namedItem(name);
    if (field && value !== undefined && value !== null && value !== '') {
      field.value = value;
    }
  }

  if (calculator.init) {
    calculator.init(root);
  }

  const schema = calculator.schema;
  let lastState = null;
  let lastResult = null;

  function handleValidationFeedback() {
    const formData = new FormData(form);
    const { valid, errors } = validate(schema, formData);
    calculateBtn.disabled = !valid;
    form.querySelectorAll('[data-error-for]').forEach((el) => {
      el.textContent = '';
    });
    if (!valid) {
      for (const error of errors) {
        const target = form.querySelector(`[data-error-for="${error.field}"]`);
        if (target) target.textContent = error.message;
      }
    }
    return valid;
  }

  form.addEventListener('input', handleValidationFeedback);
  form.addEventListener('change', handleValidationFeedback);
  handleValidationFeedback();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const { valid, state, errors } = validate(schema, formData);
    if (!valid) {
      const list = errors.map((error) => `<li><a href="#${error.field}">${error.message}</a></li>`).join('');
      errorSummary.innerHTML = `<h2>Check the highlighted fields</h2><ul>${list}</ul>`;
      errorSummary.hidden = false;
      focusErrorSummary(errorSummary);
      calculateBtn.disabled = true;
      return;
    }

    errorSummary.hidden = true;
    lastState = state;
    rememberInputs(calculatorId, state);

    lastResult = calculator.compute(state);
    const summary = calculator.summarize ? calculator.summarize(lastResult) : null;
    const costTable = calculator.costTable ? calculator.costTable(lastResult) : [];

    const summaryHtml = summary
      ? `<div class="summary-box"><div class="summary-box__title">${summary.label}</div><div class="summary-box__value">${summary.value}</div></div>`
      : '';

    const tableHtml = costTable.length ? renderCostTable(costTable) : '';
    const assumptions = calculator.assumptions ? calculator.assumptions(lastResult) : [];
    const assumptionsHtml = assumptions.length
      ? `<ul>${assumptions.map((item) => `<li>${item}</li>`).join('')}</ul>`
      : '';

    resultsPanel.querySelector('[data-result="summary"]').innerHTML = summaryHtml;
    resultsPanel.querySelector('[data-result="table"]').innerHTML = tableHtml;
    resultsPanel.querySelector('[data-result="assumptions"]').innerHTML = assumptionsHtml;

    const mathMarkdown = calculator.explain ? calculator.explain(state, lastResult) : '';
    showMathPanel.innerHTML = `<div class="show-math">${markdownToHtml(mathMarkdown)}</div>`;

    announce(liveRegion, 'Calculation complete. Results updated.');
  });

  showMathBtn.addEventListener('click', () => {
    const expanded = showMathBtn.getAttribute('aria-expanded') === 'true';
    showMathBtn.setAttribute('aria-expanded', String(!expanded));
    if (expanded) {
      showMathPanel.hidden = true;
      showMathPanel.classList.remove('accordion__content--open');
    } else {
      showMathPanel.hidden = false;
      showMathPanel.classList.add('accordion__content--open');
      showMathPanel.style.maxHeight = `${showMathPanel.scrollHeight}px`;
    }
  });

  exportButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!lastState || !lastResult) return;
      const exportPayload = calculator.export ? calculator.export(lastState, lastResult) : null;
      if (!exportPayload) return;
      const mode = button.getAttribute('data-export');
      if (mode === 'csv') {
        exportCSV(exportPayload.csv.rows, exportPayload.csv.filename);
      } else if (mode === 'xlsx') {
        exportXLSX(exportPayload.xlsx.rows, exportPayload.xlsx.filename);
      } else if (mode === 'pdf') {
        exportPDF(exportPayload.pdf.lines, exportPayload.pdf.filename);
      } else if (mode === 'print') {
        exportPrint();
      }
    });
  });
}
