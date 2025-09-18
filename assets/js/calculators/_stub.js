import { formatNumber } from '../core/units.js';

export function createStubCalculator({ id, name, description }) {
  return {
    id,
    name,
    defaults: { region: 'national' },
    schema: {
      area_sqft: { type: 'number', min: 1, required: true },
      unit_cost: { type: 'number', min: 0, required: true },
      region: { type: 'select', options: ['national', 'west', 'mountain', 'midwest', 'south', 'northeast'], required: true }
    },
    init(root) {
      const descriptionEl = root.querySelector('[data-stub-description]');
      if (descriptionEl) descriptionEl.textContent = description;
    },
    compute(state) {
      const quantity = state.area_sqft;
      const unitCost = state.unit_cost;
      const total = quantity * unitCost;
      return {
        quantity,
        unitCost,
        total
      };
    },
    summarize(result) {
      return {
        label: 'Conceptual Total',
        value: `$${formatNumber(result.total, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
      };
    },
    costTable(result) {
      return [
        { label: 'Quantity', value: `${formatNumber(result.quantity, { maximumFractionDigits: 2 })} sq ft` },
        { label: 'Unit Cost', value: `$${formatNumber(result.unitCost, { maximumFractionDigits: 2 })}` },
        { label: 'Conceptual Total', value: `$${formatNumber(result.total, { maximumFractionDigits: 2 })}` }
      ];
    },
    assumptions() {
      return ['Preliminary stub calculator—detailed logic coming soon.'];
    },
    explain(state, result) {
      return `**Total** = ${state.area_sqft} sq ft × $${state.unit_cost} = $${result.total}`;
    },
    export(state, result) {
      const rows = [
        ['Metric', 'Value'],
        ['Quantity (sq ft)', result.quantity],
        ['Unit Cost ($)', result.unitCost],
        ['Total ($)', result.total]
      ];
      return {
        csv: { rows, filename: `${id}.csv` },
        xlsx: { rows, filename: `${id}.xlsx` },
        pdf: { lines: rows.map((row) => row.join(': ')), filename: `${id}.pdf` }
      };
    }
  };
}
