/**
 * Unit conversion helpers shared across calculators.
 */

const INCHES_PER_FOOT = 12;
const SQUARE_FEET_PER_SQUARE_YARD = 9;
const CUBIC_FEET_PER_CUBIC_YARD = 27;

export function inchesToFeet(value) {
  return (Number(value) || 0) / INCHES_PER_FOOT;
}

export function feetToYards(value) {
  return (Number(value) || 0) / 3;
}

export function inchesToYards(value) {
  return inchesToFeet(value) / 3;
}

export function feetToInches(value) {
  return (Number(value) || 0) * INCHES_PER_FOOT;
}

export function squareFeet(lengthFeet, widthFeet) {
  return (Number(lengthFeet) || 0) * (Number(widthFeet) || 0);
}

export function squareFeetToSquareYards(value) {
  return (Number(value) || 0) / SQUARE_FEET_PER_SQUARE_YARD;
}

export function cubicFeet(lengthFeet, widthFeet, depthFeet) {
  return squareFeet(lengthFeet, widthFeet) * (Number(depthFeet) || 0);
}

export function cubicFeetToCubicYards(value) {
  return (Number(value) || 0) / CUBIC_FEET_PER_CUBIC_YARD;
}

export function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round((Number(value) || 0) * factor) / factor;
}

export default {
  inchesToFeet,
  feetToYards,
  inchesToYards,
  feetToInches,
  squareFeet,
  squareFeetToSquareYards,
  cubicFeet,
  cubicFeetToCubicYards,
  round
};
