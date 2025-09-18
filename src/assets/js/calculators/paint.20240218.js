import { registerCalculator } from './registry.20240218.js';
import { round } from '../core/units.20240218.js';
import { getPricingSync } from '../core/pricing.20240218.js';
import { validate } from '../core/validate.20240218.js';

const TEXTURE_COVERAGE = {
  smooth: 350,
  textured: 300,
  heavy: 250
};

const QUALITY_MULTIPLIER = {
  premium: 1.25,
  standard: 1,
  builder: 0.85
};

const schema = {
  wallAreaSqFt: { type: 'number', min: 50, message: 'Wall area must be at least 50 sq ft' },
  coats: { type: 'number', min: 1, max: 4, message: 'Coats must be 1-4' },
  texture: { type: 'enum', options: Object.keys(TEXTURE_COVERAGE) },
  quality: { type: 'enum', options: Object.keys(QUALITY_MULTIPLIER) }
};

export function compute(rawInputs) {
  const inputs = {
    wallAreaSqFt: Number(rawInputs.wallAreaSqFt),
    openingsSqFt: Number(rawInputs.openingsSqFt) || 0,
    coats: Number(rawInputs.coats) || 1,
    texture: rawInputs.texture || 'smooth',
    quality: rawInputs.quality || 'standard',
    includePrimer: Boolean(rawInputs.includePrimer),
    region: rawInputs.region || 'US_DEFAULT'
  };

  const validation = validate(inputs, schema);
  if (!validation.valid) {
    return { errors: validation.errors };
  }

  const paintableArea = Math.max(0, inputs.wallAreaSqFt - inputs.openingsSqFt);
  const coveragePerGallon = TEXTURE_COVERAGE[inputs.texture] || 350;
  const gallonsNeeded = (paintableArea / coveragePerGallon) * inputs.coats * 1.1; // include 10% waste
  const primerGallons = inputs.includePrimer ? (paintableArea / 400) : 0;

  const { data, multiplier } = getPricingSync('paint', inputs.region);
  const paintPrice = (data.gallonPremium || 48) * (QUALITY_MULTIPLIER[inputs.quality] || 1);
  const primerPrice = data.primerGallon || 24;
  const laborRate = data.laborPerSqFt || 1.35;

  const paintCost = gallonsNeeded * paintPrice * multiplier;
  const primerCost = primerGallons * primerPrice * multiplier;
  const laborCost = paintableArea * laborRate * multiplier;
  const materialCost = paintCost + primerCost;
  const totalCost = materialCost + laborCost;

  const results = {
    paintableArea: round(paintableArea, 1),
    gallonsNeeded: round(gallonsNeeded, 2),
    primerGallons: round(primerGallons, 2),
    paintCost: round(paintCost, 2),
    primerCost: round(primerCost, 2),
    laborCost: round(laborCost, 2),
    materialCost: round(materialCost, 2),
    totalCost: round(totalCost, 2),
    regionalMultiplier: multiplier
  };

  return {
    results,
    inputs,
    summary: `${results.gallonsNeeded} gallons • $${results.totalCost} total`
  };
}

export function explain({ inputs, results }) {
  if (!inputs || !results) return '';
  const lines = [
    `**Inputs**`,
    `- Paintable area: ${results.paintableArea} sq ft (openings deducted)`,
    `- Coats: ${inputs.coats}`,
    `- Texture: ${inputs.texture}`,
    `- Quality: ${inputs.quality}`,
    inputs.includePrimer ? '- Primer required' : '- Primer not required',
    '',
    `**Math**`,
    `1. Coverage (${TEXTURE_COVERAGE[inputs.texture]} sq ft/gal) adjusted for ${inputs.coats} coat(s) and 10% waste`,
    `2. Gallons = area ÷ coverage × coats × 1.1 = ${results.gallonsNeeded}`,
    `3. Primer = area ÷ 400 = ${results.primerGallons}`,
    `4. Costs include regional multiplier ${results.regionalMultiplier}`
  ];
  return lines.join('\n');
}

registerCalculator('paint', { compute, explain });

export default { compute, explain };
