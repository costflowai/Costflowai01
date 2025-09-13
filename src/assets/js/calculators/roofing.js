/**
 * Roofing Calculator Module
 * Professional roofing material and installation cost estimation
 */

import { registerCalculator } from './registry.js';

// Material pricing (per square - 100 sq ft)
const MATERIAL_PRICING = {
  'asphalt-shingles': 85,
  'architectural-shingles': 125,
  'metal-panels': 200,
  'metal-shingles': 280,
  'tile-clay': 350,
  'tile-concrete': 180,
  'slate': 800,
  'wood-shingles': 250
};

// Underlayment costs (per square)
const UNDERLAYMENT_COSTS = {
  'felt': 25,
  'synthetic': 45,
  'ice-shield': 85
};

// Regional cost factors
const REGIONAL_FACTORS = {
  'US_DEFAULT': 1.0,
  'NC': 0.95,
  'TX': 0.92,
  'CA': 1.40,
  'NY': 1.30,
  'FL': 1.10,
  'Midwest': 0.88,
  'West Coast': 1.35
};

// Pitch multipliers for slope calculations
const PITCH_MULTIPLIERS = {
  '3/12': 1.031,
  '4/12': 1.054,
  '5/12': 1.083,
  '6/12': 1.118,
  '7/12': 1.158,
  '8/12': 1.202,
  '9/12': 1.250,
  '10/12': 1.302,
  '11/12': 1.356,
  '12/12': 1.414
};

function compute(inputs) {
  // Input validation and defaults
  const length = Math.max(0, parseFloat(inputs.length) || 0);
  const width = Math.max(0, parseFloat(inputs.width) || 0);
  const pitch = inputs.pitch || '6/12';
  const material = inputs.material || 'asphalt-shingles';
  const underlayment = inputs.underlayment || 'felt';
  const complexity = inputs.complexity || 'simple';
  const region = inputs.region || 'US_DEFAULT';
  
  // Calculate roof area
  const footprint = length * width;
  const pitchMultiplier = PITCH_MULTIPLIERS[pitch] || 1.118;
  const roofArea = footprint * pitchMultiplier;
  
  // Convert to squares (100 sq ft units)
  const squares = roofArea / 100;
  
  // Complexity factors
  const complexityFactors = {
    'simple': 1.0,      // Simple gable
    'moderate': 1.15,   // Some hips, valleys
    'complex': 1.35     // Multiple levels, dormers
  };
  const complexityFactor = complexityFactors[complexity] || 1.0;
  const adjustedSquares = squares * complexityFactor;
  
  // Regional pricing adjustments
  const regionalFactor = REGIONAL_FACTORS[region] || 1.0;
  const materialPrice = (MATERIAL_PRICING[material] || 85) * regionalFactor;
  const underlaymentPrice = (UNDERLAYMENT_COSTS[underlayment] || 25) * regionalFactor;
  
  // Cost calculations
  const materialCost = adjustedSquares * materialPrice;
  const underlaymentCost = adjustedSquares * underlaymentPrice;
  
  // Labor costs (varies by material type)
  const laborRates = {
    'asphalt-shingles': 65,
    'architectural-shingles': 75,
    'metal-panels': 85,
    'metal-shingles': 120,
    'tile-clay': 150,
    'tile-concrete': 110,
    'slate': 200,
    'wood-shingles': 130
  };
  
  const laborRate = (laborRates[material] || 65) * regionalFactor;
  const laborCost = adjustedSquares * laborRate;
  
  // Additional costs
  const flashingCost = adjustedSquares * 15 * regionalFactor; // Flashing, ridge caps
  const permitCost = 150 * regionalFactor; // Building permit
  const dumpsterCost = material.includes('tile') || material === 'slate' ? 400 : 300; // Disposal
  
  // Tear-off costs (if replacement)
  const tearOffCost = inputs.tearOff ? adjustedSquares * 45 * regionalFactor : 0;
  
  const totalCost = materialCost + underlaymentCost + laborCost + flashingCost + 
                    permitCost + dumpsterCost + tearOffCost;
  
  return {
    footprint: footprint,
    roofArea: roofArea,
    squares: adjustedSquares,
    pitchMultiplier: pitchMultiplier,
    complexityFactor: complexityFactor,
    materialCost: materialCost,
    underlaymentCost: underlaymentCost,
    laborCost: laborCost,
    flashingCost: flashingCost,
    permitCost: permitCost,
    dumpsterCost: dumpsterCost,
    tearOffCost: tearOffCost,
    totalCost: totalCost,
    regionalFactor: regionalFactor,
    
    // Breakdown for transparency
    breakdown: {
      baseSquares: squares,
      adjustedSquares: adjustedSquares,
      materialPricePerSquare: materialPrice,
      laborRatePerSquare: laborRate,
      pitchAdjustment: pitchMultiplier
    }
  };
}

// Formula information for transparency
const formula = {
  title: 'Roofing Area & Cost Calculation',
  expressions: [
    'Roof Area = Length × Width × Pitch Multiplier',
    'Squares = Roof Area ÷ 100',
    'Adjusted Squares = Squares × Complexity Factor',
    'Material Cost = Adjusted Squares × Material Price × Regional Factor',
    'Labor Cost = Adjusted Squares × Labor Rate × Regional Factor'
  ],
  notes: [
    'Pitch multipliers account for slope: 3/12 = 1.031, 6/12 = 1.118, 12/12 = 1.414',
    'Complexity factors: Simple 1.0, Moderate 1.15, Complex 1.35',
    'Includes underlayment, flashing, permits, and disposal costs',
    'Labor rates vary by material difficulty and installation time',
    'Does not include structural repairs or ventilation upgrades'
  ],
  methodology: 'Calculations follow NRCA (National Roofing Contractors Association) standards and local building codes.'
};

// Register the calculator
registerCalculator('roofing', { compute, formula });

export { compute, formula };