import { registerCalculator } from './registry.js';
import { squareFeet, round } from '../core/units.js';
import { getPricingSync } from '../core/pricing.js';
import { validate } from '../core/validate.js';

const STUD_SPACING = {
  '12': 12,
  '16': 16,
  '24': 24
};

const LUMBER_LENGTH_FACTOR = {
  '2x4': 8,
  '2x6': 10
};

const schema = {
  wallLengthFt: { type: 'number', min: 1, message: 'Wall length must be ≥ 1 ft' },
  wallHeightFt: { type: 'number', min: 7, message: 'Wall height must be ≥ 7 ft' },
  spacing: { type: 'enum', options: Object.keys(STUD_SPACING) },
  lumberSize: { type: 'enum', options: Object.keys(LUMBER_LENGTH_FACTOR) }
};

export function compute(rawInputs) {
  const inputs = {
    wallLengthFt: Number(rawInputs.wallLengthFt),
    wallHeightFt: Number(rawInputs.wallHeightFt),
    spacing: rawInputs.spacing || '16',
    lumberSize: rawInputs.lumberSize || '2x4',
    region: rawInputs.region || 'US_DEFAULT'
  };

  const validation = validate(inputs, schema);
  if (!validation.valid) {
    return { errors: validation.errors };
  }

  const spacingInches = STUD_SPACING[inputs.spacing] || 16;
  const studCount = Math.ceil((inputs.wallLengthFt * 12) / spacingInches) + 1;
  const platesLinearFeet = inputs.wallLengthFt * 3; // top + bottom plates
  const areaSqFt = squareFeet(inputs.wallLengthFt, inputs.wallHeightFt);

  const { data, multiplier } = getPricingSync('framing', inputs.region);
  const studLength = LUMBER_LENGTH_FACTOR[inputs.lumberSize] || 8;
  const studCost = studCount * (studLength > 8 ? data.stud10ft : data.stud8ft || 4.5) * multiplier;
  const sheathingCost = areaSqFt * (data.sheathingPerSqFt || 1.6) * multiplier * 1.07;
  const hardwareCost = areaSqFt * (data.hardwarePerSqFt || 0.55) * multiplier;
  const laborCost = areaSqFt * (data.laborPerSqFt || 3.25) * multiplier;
  const totalCost = studCost + sheathingCost + hardwareCost + laborCost;

  const results = {
    studCount,
    platesLinearFeet: round(platesLinearFeet, 1),
    areaSqFt: round(areaSqFt, 1),
    studCost: round(studCost, 2),
    sheathingCost: round(sheathingCost, 2),
    hardwareCost: round(hardwareCost, 2),
    laborCost: round(laborCost, 2),
    totalCost: round(totalCost, 2),
    regionalMultiplier: multiplier
  };

  return {
    results,
    inputs,
    summary: `${results.studCount} studs • $${results.totalCost} total`
  };
}

export function explain({ inputs, results }) {
  if (!inputs || !results) return '';
  const lines = [
    `**Inputs**`,
    `- Wall length: ${inputs.wallLengthFt} ft`,
    `- Wall height: ${inputs.wallHeightFt} ft`,
    `- Stud spacing: ${inputs.spacing}" on center`,
    `- Lumber: ${inputs.lumberSize}`,
    '',
    `**Math**`,
    `1. Stud count = (length ft × 12 in) ÷ spacing + 1 = ${results.studCount}`,
    `2. Plates = wall length × 3 = ${results.platesLinearFeet} linear ft`,
    `3. Area = ${inputs.wallLengthFt} × ${inputs.wallHeightFt} = ${results.areaSqFt} sq ft`,
    `4. Costs derived from pricing table with regional multiplier ${results.regionalMultiplier}`
  ];
  return lines.join('\n');
}

registerCalculator('framing', { compute, explain });

export default { compute, explain };
