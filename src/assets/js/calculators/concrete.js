/**
 * Concrete Calculator Module
 * Professional concrete estimation with regional pricing and waste factors
 */

import { registerCalculator } from './registry.js';

// Waste factors by pour type
const WASTE_FACTORS = {
  slab: 1.05,      // 5% waste for slabs
  footing: 1.08,   // 8% waste for footings  
  wall: 1.10,      // 10% waste for walls
  stairs: 1.15,    // 15% waste for stairs
  drive: 1.07      // 7% waste for driveways
};

// Regional cost factors
const REGIONAL_FACTORS = {
  'US_DEFAULT': 1.0,
  'NC': 0.95,      // North Carolina - slightly below national average
  'TX': 0.92,      // Texas - lower cost
  'CA': 1.35,      // California - significantly higher
  'NY': 1.25,      // New York - higher cost
  'FL': 1.02,      // Florida - slightly above average
  'Midwest': 0.88, 
  'West Coast': 1.30
};

// PSI pricing (per cubic yard)
const PSI_PRICING = {
  2500: 125,
  3000: 130,
  3500: 135,
  4000: 140,
  4500: 145,
  5000: 155
};

// Rebar costs (per sq ft)
const REBAR_COSTS = {
  none: 0,
  light: 0.65,    // #3 @ 18"
  standard: 0.85, // #4 @ 12"
  heavy: 1.25     // #5 @ 12"
};

// Delivery costs
const DELIVERY_COSTS = {
  truck: 0,       // Standard ready-mix truck
  pump: 150,      // Concrete pump surcharge
  crane: 200      // Crane bucket surcharge
};

function compute(inputs) {
  // Input validation and defaults
  const lengthFt = Math.max(0, parseFloat(inputs.lengthFt) || 0);
  const widthFt = Math.max(0, parseFloat(inputs.widthFt) || 0);
  const thicknessIn = Math.max(1, parseFloat(inputs.thicknessIn) || 4);
  const psi = parseInt(inputs.psi) || 3500;
  const pourType = inputs.pourType || 'slab';
  const rebarType = inputs.rebarType || 'none';
  const deliveryType = inputs.deliveryType || 'truck';
  const region = inputs.region || 'US_DEFAULT';
  
  // Basic calculations
  const thicknessFt = thicknessIn / 12;
  const volumeCuFt = lengthFt * widthFt * thicknessFt;
  const volumeCuYd = volumeCuFt / 27;
  
  // Apply waste factor
  const wasteFactor = WASTE_FACTORS[pourType] || 1.1;
  const adjustedVolume = volumeCuYd * wasteFactor;
  
  // Regional pricing adjustments
  const regionalFactor = REGIONAL_FACTORS[region] || 1.0;
  const mixPrice = (PSI_PRICING[psi] || 135) * regionalFactor;
  
  // Cost calculations
  const area = lengthFt * widthFt;
  const materialCost = adjustedVolume * mixPrice;
  const rebarCost = area * (REBAR_COSTS[rebarType] || 0) * regionalFactor;
  const deliveryCost = DELIVERY_COSTS[deliveryType] || 0;
  const laborRate = 45 * regionalFactor; // Base labor rate per yard
  const laborCost = adjustedVolume * laborRate;
  
  const totalCost = materialCost + rebarCost + deliveryCost + laborCost;
  
  return {
    volume: volumeCuFt,
    yards: adjustedVolume,
    area: area,
    wasteFactor: wasteFactor,
    materialCost: materialCost,
    rebarCost: rebarCost,
    deliveryCost: deliveryCost,
    laborCost: laborCost,
    totalCost: totalCost,
    regionalFactor: regionalFactor,
    mixPrice: mixPrice,
    
    // Breakdown for transparency
    breakdown: {
      baseConcrete: volumeCuYd,
      adjustedConcrete: adjustedVolume,
      pricePerYard: mixPrice,
      laborPerYard: laborRate
    }
  };
}

// Formula information for transparency
const formula = {
  title: 'Concrete Volume & Cost Calculation',
  expressions: [
    'Volume (cu ft) = Length × Width × Thickness',
    'Volume (cu yd) = Volume (cu ft) ÷ 27',
    'Adjusted Volume = Volume × Waste Factor',
    'Material Cost = Adjusted Volume × PSI Price × Regional Factor',
    'Labor Cost = Adjusted Volume × Labor Rate × Regional Factor'
  ],
  notes: [
    'Thickness converted from inches to feet (÷12)',
    'Waste factors: Slab 5%, Footing 8%, Wall 10%, Stairs 15%',
    'Regional factors adjust for local market conditions',
    'Labor rates based on standard crew productivity',
    'Does not include excavation, forms, or finishing'
  ],
  methodology: 'Calculations follow ACI (American Concrete Institute) guidelines and construction industry best practices.'
};

// Register the calculator
registerCalculator('concrete', { compute, formula });

export { compute, formula };