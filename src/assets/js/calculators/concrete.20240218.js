import { registerCalculator } from './registry.20240218.js';
import { inchesToFeet, cubicFeet, cubicFeetToCubicYards, squareFeet, round } from '../core/units.20240218.js';
import { getPricingSync } from '../core/pricing.20240218.js';
import { validate } from '../core/validate.20240218.js';

const POUR_WASTE = {
  slab: 1.05,
  footing: 1.08,
  wall: 1.1,
  stairs: 1.15,
  driveway: 1.07
};

const REBAR_FACTOR = {
  none: 0,
  light: 0.45,
  standard: 1,
  heavy: 1.35
};

const DELIVERY_FEE = {
  truck: 0,
  pump: 175,
  crane: 225
};

const schema = {
  lengthFt: { type: 'number', min: 1, message: 'Length must be at least 1 ft' },
  widthFt: { type: 'number', min: 1, message: 'Width must be at least 1 ft' },
  thicknessIn: { type: 'number', min: 2, message: 'Thickness must be at least 2 in' },
  psi: { type: 'number', min: 2500, max: 6000, message: 'PSI must be 2500-6000' },
  pourType: { type: 'enum', options: Object.keys(POUR_WASTE) },
  rebarType: { type: 'enum', options: Object.keys(REBAR_FACTOR) },
  deliveryType: { type: 'enum', options: Object.keys(DELIVERY_FEE) }
};

export function compute(rawInputs) {
  const inputs = {
    lengthFt: Number(rawInputs.lengthFt),
    widthFt: Number(rawInputs.widthFt),
    thicknessIn: Number(rawInputs.thicknessIn),
    psi: Number(rawInputs.psi) || 3500,
    pourType: rawInputs.pourType || 'slab',
    rebarType: rawInputs.rebarType || 'standard',
    deliveryType: rawInputs.deliveryType || 'truck',
    region: rawInputs.region || 'US_DEFAULT'
  };

  const validation = validate(inputs, schema);
  if (!validation.valid) {
    return { errors: validation.errors };
  }

  const thicknessFt = inchesToFeet(inputs.thicknessIn);
  const areaSqFt = squareFeet(inputs.lengthFt, inputs.widthFt);
  const volumeCuFt = cubicFeet(inputs.lengthFt, inputs.widthFt, thicknessFt);
  const volumeCuYd = cubicFeetToCubicYards(volumeCuFt);

  const wasteFactor = POUR_WASTE[inputs.pourType] ?? 1.08;
  const adjustedYards = volumeCuYd * wasteFactor;

  const { data, multiplier } = getPricingSync('concrete', inputs.region);
  const materialCost = adjustedYards * (data.material || 135) * multiplier;
  const laborCost = adjustedYards * (data.labor || 45) * multiplier;
  const rebarCost = areaSqFt * (data.reinforcementPerSqFt || 0.85) * (REBAR_FACTOR[inputs.rebarType] ?? 1) * multiplier;
  const deliveryCost = (DELIVERY_FEE[inputs.deliveryType] || 0) * multiplier;
  const totalCost = materialCost + laborCost + rebarCost + deliveryCost;

  const results = {
    areaSqFt: round(areaSqFt, 2),
    baseYards: round(volumeCuYd, 3),
    adjustedYards: round(adjustedYards, 3),
    materialCost: round(materialCost, 2),
    laborCost: round(laborCost, 2),
    rebarCost: round(rebarCost, 2),
    deliveryCost: round(deliveryCost, 2),
    totalCost: round(totalCost, 2),
    wasteFactor: wasteFactor,
    regionalMultiplier: multiplier
  };

  return {
    results,
    inputs,
    summary: `Estimated ${round(adjustedYards, 2)} cu yd @ $${round(totalCost, 2)} total`
  };
}

export function explain({ inputs, results }) {
  if (!inputs || !results) return '';
  const { lengthFt, widthFt, thicknessIn, pourType, rebarType, deliveryType, region } = inputs;
  const lines = [
    `**Project Inputs**`,
    `- Dimensions: ${lengthFt} ft × ${widthFt} ft × ${thicknessIn}"`,
    `- Pour type: ${pourType} (waste factor ${POUR_WASTE[pourType] ?? 1.08})`,
    `- Reinforcement: ${rebarType}`,
    `- Delivery: ${deliveryType}`,
    `- Region: ${region}`,
    '',
    `**Math**`,
    `1. Area = ${lengthFt} × ${widthFt} = ${results.areaSqFt} sq ft`,
    `2. Thickness = ${thicknessIn}" ÷ 12 = ${round(inchesToFeet(thicknessIn), 3)} ft`,
    `3. Volume = Area × Thickness = ${round(results.areaSqFt * inchesToFeet(thicknessIn), 3)} cu ft`,
    `4. Cubic yards = Volume ÷ 27 = ${results.baseYards} cu yd`,
    `5. Waste applied (${POUR_WASTE[pourType] ?? 1.08}×) = ${results.adjustedYards} cu yd`,
    `6. Regional multiplier ${results.regionalMultiplier} applied to costs`
  ];
  return lines.join('\n');
}

registerCalculator('concrete', { compute, explain });

export default {
  compute,
  explain
};
