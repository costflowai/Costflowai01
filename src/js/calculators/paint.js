/**
 * Paint Calculator Module
 * Professional paint quantity and cost estimation
 */

import { registerCalculator } from './registry.js';

// Coverage rates (sq ft per gallon)
const COVERAGE_RATES = {
  smooth: 400,      // Smooth surfaces
  light: 350,       // Light texture
  medium: 300,      // Medium texture  
  heavy: 250,       // Heavy texture
  stucco: 200       // Stucco/rough surfaces
};

// Paint quality pricing (per gallon)
const PAINT_PRICING = {
  economy: 35,      // Basic latex paint
  standard: 55,     // Mid-grade paint
  premium: 75,      // High-quality paint
  luxury: 95        // Premium brand paint
};

// Primer pricing (per gallon)
const PRIMER_PRICING = {
  economy: 30,
  standard: 45,
  premium: 60,
  luxury: 75
};

// Regional cost factors
const REGIONAL_FACTORS = {
  'US_DEFAULT': 1.0,
  'NC': 0.95,
  'TX': 0.92,
  'CA': 1.25,
  'NY': 1.20,
  'FL': 1.05,
  'Midwest': 0.90,
  'West Coast': 1.22
};

function compute(inputs) {
  // Input validation and defaults
  const wallArea = Math.max(0, parseFloat(inputs.wallArea) || 0);
  const openings = Math.max(0, parseFloat(inputs.openings) || 0);
  const coats = Math.max(1, parseInt(inputs.coats) || 2);
  const texture = inputs.texture || 'smooth';
  const quality = inputs.quality || 'standard';
  const needsPrimer = Boolean(inputs.needsPrimer);
  const region = inputs.region || 'US_DEFAULT';
  
  // Calculate paintable area
  const paintableArea = Math.max(0, wallArea - openings);
  
  // Coverage and paint requirements
  const coverageRate = COVERAGE_RATES[texture] || 350;
  const paintNeeded = (paintableArea * coats) / coverageRate;
  const paintGallons = Math.ceil(paintNeeded * 4) / 4; // Round to nearest quart
  
  // Primer requirements (if needed)
  const primerGallons = needsPrimer ? Math.ceil(paintableArea / coverageRate * 4) / 4 : 0;
  
  // Regional pricing adjustments
  const regionalFactor = REGIONAL_FACTORS[region] || 1.0;
  const paintPrice = (PAINT_PRICING[quality] || 55) * regionalFactor;
  const primerPrice = (PRIMER_PRICING[quality] || 45) * regionalFactor;
  
  // Cost calculations
  const paintCost = paintGallons * paintPrice;
  const primerCost = primerGallons * primerPrice;
  const materialCost = paintCost + primerCost;
  
  // Labor calculation (assumes professional application)
  const laborRate = 2.50 * regionalFactor; // Per sq ft
  const laborCost = paintableArea * laborRate * coats;
  
  const totalCost = materialCost + laborCost;
  
  return {
    paintableArea: paintableArea,
    paintGallons: paintGallons,
    primerGallons: primerGallons,
    paintCost: paintCost,
    primerCost: primerCost,
    materialCost: materialCost,
    laborCost: laborCost,
    totalCost: totalCost,
    coverageRate: coverageRate,
    coats: coats,
    regionalFactor: regionalFactor,
    
    // Breakdown for transparency
    breakdown: {
      baseArea: wallArea,
      openingDeduction: openings,
      effectiveArea: paintableArea,
      paintPricePerGallon: paintPrice,
      primerPricePerGallon: primerPrice,
      laborRatePerSqFt: laborRate
    }
  };
}

// Formula information for transparency
const formula = {
  title: 'Paint Coverage & Cost Calculation',
  expressions: [
    'Paintable Area = Wall Area - Openings',
    'Paint Needed = (Paintable Area × Coats) ÷ Coverage Rate',
    'Paint Gallons = Round up to nearest quart',
    'Material Cost = (Paint Gallons × Paint Price) + (Primer × Primer Price)',
    'Labor Cost = Paintable Area × Labor Rate × Coats × Regional Factor'
  ],
  notes: [
    'Coverage rates vary by surface texture (smooth: 400 sq ft/gal, heavy: 250 sq ft/gal)',
    'Primer coverage calculated at single coat rate',
    'Labor rates include surface preparation and application',
    'Regional factors adjust for local material and labor costs',
    'Does not include trim work or specialty finishes'
  ],
  methodology: 'Calculations based on industry-standard coverage rates and professional application practices.'
};

// Register the calculator
registerCalculator('paint', { compute, formula });

export { compute, formula };