/**
 * Framing Calculator Module
 * Professional lumber and framing cost estimation
 */

import { registerCalculator } from './registry.js';

// Lumber pricing (per board foot)
const LUMBER_PRICING = {
  'douglas-fir': 0.85,
  'southern-pine': 0.75,
  'hem-fir': 0.70,
  'spf': 0.65,
  'engineered': 1.25
};

// Common lumber sizes (board feet per linear foot)
const LUMBER_SIZES = {
  '2x4': 0.67,
  '2x6': 1.0,
  '2x8': 1.33,
  '2x10': 1.67,
  '2x12': 2.0,
  '4x4': 1.33,
  '4x6': 2.0
};

// Regional cost factors
const REGIONAL_FACTORS = {
  'US_DEFAULT': 1.0,
  'NC': 0.92,
  'TX': 0.88,
  'CA': 1.35,
  'NY': 1.28,
  'FL': 1.05,
  'Midwest': 0.85,
  'West Coast': 1.32
};

// Framing factors (linear feet of lumber per sq ft of area)
const FRAMING_FACTORS = {
  'floor': 2.4,      // Floor joists
  'wall': 1.8,       // Wall studs  
  'ceiling': 2.2,    // Ceiling joists
  'roof': 2.8        // Roof rafters
};

function compute(inputs) {
  // Input validation and defaults
  const area = Math.max(0, parseFloat(inputs.area) || 0);
  const framingType = inputs.framingType || 'wall';
  const lumberSize = inputs.lumberSize || '2x4';
  const lumberGrade = inputs.lumberGrade || 'spf';
  const spacing = parseFloat(inputs.spacing) || 16;
  const region = inputs.region || 'US_DEFAULT';
  
  // Calculate lumber requirements
  const framingFactor = FRAMING_FACTORS[framingType] || 1.8;
  const spacingFactor = 16 / spacing; // Adjust for spacing (16" OC is baseline)
  const linearFeet = area * framingFactor * spacingFactor;
  
  // Calculate board feet
  const boardFeetPerLinearFoot = LUMBER_SIZES[lumberSize] || 0.67;
  const totalBoardFeet = linearFeet * boardFeetPerLinearFoot;
  
  // Regional pricing adjustments
  const regionalFactor = REGIONAL_FACTORS[region] || 1.0;
  const pricePerBoardFoot = (LUMBER_PRICING[lumberGrade] || 0.75) * regionalFactor;
  
  // Cost calculations
  const materialCost = totalBoardFeet * pricePerBoardFoot;
  
  // Hardware costs (nails, screws, plates, etc.)
  const hardwareCost = area * 0.35 * regionalFactor;
  
  // Labor costs
  const laborRate = 2.25 * regionalFactor; // Per sq ft
  const laborCost = area * laborRate;
  
  // Waste factor (10% for framing)
  const wasteFactor = 1.10;
  const adjustedMaterialCost = materialCost * wasteFactor;
  const adjustedHardwareCost = hardwareCost * wasteFactor;
  
  const totalCost = adjustedMaterialCost + adjustedHardwareCost + laborCost;
  
  return {
    area: area,
    linearFeet: linearFeet,
    boardFeet: totalBoardFeet,
    materialCost: adjustedMaterialCost,
    hardwareCost: adjustedHardwareCost,
    laborCost: laborCost,
    totalCost: totalCost,
    wasteFactor: wasteFactor,
    regionalFactor: regionalFactor,
    
    // Breakdown for transparency
    breakdown: {
      baseMaterialCost: materialCost,
      baseHardwareCost: hardwareCost,
      pricePerBoardFoot: pricePerBoardFoot,
      laborRatePerSqFt: laborRate,
      spacingFactor: spacingFactor
    }
  };
}

// Formula information for transparency
const formula = {
  title: 'Framing Material & Cost Calculation',
  expressions: [
    'Linear Feet = Area × Framing Factor × Spacing Factor',
    'Board Feet = Linear Feet × Board Feet per Linear Foot',
    'Material Cost = Board Feet × Price per Board Foot × Regional Factor × Waste Factor',
    'Hardware Cost = Area × Hardware Rate × Regional Factor × Waste Factor',
    'Labor Cost = Area × Labor Rate × Regional Factor'
  ],
  notes: [
    'Framing factors: Floor 2.4, Wall 1.8, Ceiling 2.2, Roof 2.8 LF/SF',
    'Spacing factor adjusts for stud/joist spacing (16" OC baseline)',
    'Waste factor of 10% applied to materials',
    'Hardware includes nails, screws, plates, and fasteners',
    'Does not include sheathing, insulation, or finish materials'
  ],
  methodology: 'Calculations based on standard construction practices and International Residential Code requirements.'
};

// Register the calculator
registerCalculator('framing', { compute, formula });

export { compute, formula };