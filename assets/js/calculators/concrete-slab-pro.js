import { applyWaste, cubicFeetToCubicYards, formatNumber, inchesToFeet, volumeFt3 } from '../core/units.js';
import { resolvePrice, describeOverrides } from '../core/pricing.js';

const GRID_OPTIONS = [12, 18, 24];

export const calculator = {
  id: 'concrete-slab-pro',
  name: 'Concrete Slab Pro',
  defaults: {
    length_ft: 20,
    width_ft: 10,
    thickness_in: 4,
    waste_percent: 5,
    rebar_grid_in: 12,
    rebar_lap_in: 24,
    productivity_yd3_hr: 3,
    region: 'national'
  },
  schema: {
    length_ft: { type: 'number', min: 1, required: true },
    width_ft: { type: 'number', min: 1, required: true },
    thickness_in: { type: 'number', min: 1, required: true },
    waste_percent: { type: 'number', min: 0, max: 50, required: true },
    rebar_grid_in: { type: 'number', required: true },
    rebar_lap_in: { type: 'number', min: 0, required: true },
    concrete_unit_price: { type: 'number', min: 0, required: false },
    labor_rate: { type: 'number', min: 0, required: false },
    productivity_yd3_hr: { type: 'number', min: 0.1, required: true },
    equipment_flat: { type: 'number', min: 0, required: false },
    region: { type: 'select', options: ['national', 'west', 'mountain', 'midwest', 'south', 'northeast'], required: true },
    include_markup: { type: 'boolean' },
    include_tax: { type: 'boolean' }
  },
  init(root) {
    const gridSelect = root.querySelector('select[name="rebar_grid_in"]');
    gridSelect.innerHTML = GRID_OPTIONS.map((value) => `<option value="${value}">${value}\u2033 OC</option>`).join('');
  },
  compute(state) {
    const lengthFt = state.length_ft;
    const widthFt = state.width_ft;
    const thicknessIn = state.thickness_in;
    const wastePercent = state.waste_percent;
    const gridIn = state.rebar_grid_in;
    const lapIn = state.rebar_lap_in;
    const productivity = state.productivity_yd3_hr;

    const overrides = {
      'materials.concrete_yd3': state.concrete_unit_price,
      'labor.concrete_finisher_hr': state.labor_rate,
      'equipment.concrete_pump_flat': state.equipment_flat
    };

    const { value: concreteUnit, overridden: concreteOverridden } = resolvePrice('materials.concrete_yd3', overrides, state.region);
    const { value: rebarUnit } = resolvePrice('materials.rebar_ft', overrides, state.region);
    const { value: laborRate, overridden: laborOverridden } = resolvePrice('labor.concrete_finisher_hr', overrides, state.region);
    const { value: equipmentFlat, overridden: equipmentOverridden } = resolvePrice('equipment.concrete_pump_flat', overrides, state.region);

    const volumeFt3Raw = volumeFt3(lengthFt, widthFt, thicknessIn);
    const volumeYd3 = cubicFeetToCubicYards(volumeFt3Raw);
    const volumeYd3Waste = applyWaste(volumeYd3, wastePercent);

    const barsX = Math.ceil((widthFt * 12) / gridIn) + 1;
    const barsY = Math.ceil((lengthFt * 12) / gridIn) + 1;
    const lapFt = (barsX + barsY) * inchesToFeet(lapIn);
    const totalRebarFt = barsX * lengthFt + barsY * widthFt + lapFt;

    const materialCost = volumeYd3Waste * concreteUnit + totalRebarFt * rebarUnit;
    const laborHours = volumeYd3Waste / productivity;
    const laborCost = laborHours * laborRate;
    const equipmentCost = state.equipment_flat ?? equipmentFlat;

    const subtotal = materialCost + laborCost + equipmentCost;
    const markupRate = state.include_markup ? 0.1 : 0;
    const markupAmount = subtotal * markupRate;
    const taxableBase = subtotal + markupAmount;
    const taxRate = state.include_tax ? 0.0825 : 0;
    const taxAmount = taxableBase * taxRate;
    const total = subtotal + markupAmount + taxAmount;

    return {
      inputs: state,
      metrics: {
        volumeFt3: volumeFt3Raw,
        volumeYd3,
        volumeYd3Waste,
        rebarFt: totalRebarFt,
        barsX,
        barsY,
        laborHours
      },
      pricing: {
        concreteUnit,
        concreteOverridden,
        rebarUnit,
        laborRate,
        laborOverridden,
        equipmentCost,
        equipmentOverridden
      },
      totals: {
        materialCost,
        laborCost,
        equipmentCost,
        markupAmount,
        taxAmount,
        subtotal,
        total
      },
      overrides: describeOverrides(overrides)
    };
  },
  summarize(result) {
    return {
      label: 'ROM Total Installed Cost',
      value: `$${formatNumber(result.totals.total, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
    };
  },
  costTable(result) {
    return [
      { label: 'Material', value: `$${formatNumber(result.totals.materialCost, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` },
      { label: 'Labor', value: `$${formatNumber(result.totals.laborCost, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` },
      { label: 'Equipment', value: `$${formatNumber(result.totals.equipmentCost, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` },
      { label: 'GC / Markup', value: `$${formatNumber(result.totals.markupAmount, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` },
      { label: 'Sales Tax', value: `$${formatNumber(result.totals.taxAmount, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` },
      { label: 'ROM Total', value: `$${formatNumber(result.totals.total, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` }
    ];
  },
  assumptions(result) {
    const overrides = result.overrides.length
      ? [`Manual overrides: ${result.overrides.join(', ')}`]
      : [];
    return [
      `Rebar grid ${result.metrics.barsX}×${result.metrics.barsY} with ${formatNumber(result.metrics.rebarFt, { maximumFractionDigits: 0 })} LF`,
      `Waste factor ${result.inputs.waste_percent}% applied`,
      `Productivity ${formatNumber(result.inputs.productivity_yd3_hr, { maximumFractionDigits: 2 })} yd³/hr`,
      ...overrides
    ];
  },
  explain(state, result) {
    const lines = [
      `**Volume** = ${state.length_ft} ft × ${state.width_ft} ft × ${state.thickness_in}/12 ft = ${formatNumber(result.metrics.volumeFt3, { maximumFractionDigits: 2 })} ft³`,
      `Convert to yd³ → ${formatNumber(result.metrics.volumeYd3, { maximumFractionDigits: 2 })} yd³`,
      `Waste (${state.waste_percent}%): ${formatNumber(result.metrics.volumeYd3Waste, { maximumFractionDigits: 2 })} yd³`,
      `Rebar bars: ${result.metrics.barsX} L-direction + ${result.metrics.barsY} W-direction`,
      `Rebar total: ${formatNumber(result.metrics.rebarFt, { maximumFractionDigits: 0 })} LF × $${formatNumber(result.pricing.rebarUnit, { maximumFractionDigits: 2 })}`,
      `Material = Concrete ${formatNumber(result.metrics.volumeYd3Waste, { maximumFractionDigits: 2 })} × $${formatNumber(result.pricing.concreteUnit, { maximumFractionDigits: 2 })}`,
      `Labor hours = ${formatNumber(result.metrics.volumeYd3Waste, { maximumFractionDigits: 2 })} ÷ ${formatNumber(state.productivity_yd3_hr, { maximumFractionDigits: 2 })} = ${formatNumber(result.metrics.laborHours, { maximumFractionDigits: 2 })}`,
      `Labor cost = ${formatNumber(result.metrics.laborHours, { maximumFractionDigits: 2 })} × $${formatNumber(result.pricing.laborRate, { maximumFractionDigits: 2 })}`,
      `Equipment flat = $${formatNumber(result.totals.equipmentCost, { maximumFractionDigits: 2 })}`,
      `Subtotal = $${formatNumber(result.totals.subtotal, { maximumFractionDigits: 2 })}`,
      `Markup (${state.include_markup ? '10%' : '0%'}) = $${formatNumber(result.totals.markupAmount, { maximumFractionDigits: 2 })}`,
      `Tax (${state.include_tax ? '8.25%' : '0%'}) = $${formatNumber(result.totals.taxAmount, { maximumFractionDigits: 2 })}`,
      `Total = $${formatNumber(result.totals.total, { maximumFractionDigits: 2 })}`
    ];
    return lines.join('\n');
  },
  export(state, result) {
    const headers = ['Item', 'Quantity', 'Unit', 'Rate', 'Amount'];
    const rows = [
      headers,
      ['Concrete Volume', formatNumber(result.metrics.volumeYd3Waste, { maximumFractionDigits: 2 }), 'yd³', `$${formatNumber(result.pricing.concreteUnit, { maximumFractionDigits: 2 })}`, `$${formatNumber(result.metrics.volumeYd3Waste * result.pricing.concreteUnit, { maximumFractionDigits: 2 })}`],
      ['Rebar Length', formatNumber(result.metrics.rebarFt, { maximumFractionDigits: 0 }), 'LF', `$${formatNumber(result.pricing.rebarUnit, { maximumFractionDigits: 2 })}`, `$${formatNumber(result.metrics.rebarFt * result.pricing.rebarUnit, { maximumFractionDigits: 2 })}`],
      ['Labor Hours', formatNumber(result.metrics.laborHours, { maximumFractionDigits: 2 }), 'hrs', `$${formatNumber(result.pricing.laborRate, { maximumFractionDigits: 2 })}`, `$${formatNumber(result.totals.laborCost, { maximumFractionDigits: 2 })}`],
      ['Equipment', '-', '-', '-', `$${formatNumber(result.totals.equipmentCost, { maximumFractionDigits: 2 })}`],
      ['Subtotal', '-', '-', '-', `$${formatNumber(result.totals.subtotal, { maximumFractionDigits: 2 })}`],
      ['Markup', '-', '-', '-', `$${formatNumber(result.totals.markupAmount, { maximumFractionDigits: 2 })}`],
      ['Tax', '-', '-', '-', `$${formatNumber(result.totals.taxAmount, { maximumFractionDigits: 2 })}`],
      ['Total', '-', '-', '-', `$${formatNumber(result.totals.total, { maximumFractionDigits: 2 })}`]
    ];

    const pdfLines = rows.map((row) => row.join(' \u2022 '));

    return {
      csv: { rows, filename: 'concrete-slab-pro.csv' },
      xlsx: { rows, filename: 'concrete-slab-pro.xlsx' },
      pdf: { lines: pdfLines, filename: 'concrete-slab-pro.pdf' }
    };
  }
};
