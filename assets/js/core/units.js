const FOOT_TO_METER = 0.3048;
const INCH_TO_FOOT = 1 / 12;
const YARD3_TO_FT3 = 27;

export function feetToMeters(value) {
  return value * FOOT_TO_METER;
}

export function inchesToFeet(value) {
  return value * INCH_TO_FOOT;
}

export function cubicFeetToCubicYards(value) {
  return value / YARD3_TO_FT3;
}

export function round(value, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function formatNumber(value, options = {}) {
  const { style = 'decimal', maximumFractionDigits = 2, minimumFractionDigits = 0 } = options;
  const formatter = new Intl.NumberFormat('en-US', { style, maximumFractionDigits, minimumFractionDigits });
  return formatter.format(value);
}

export function areaSqFt(lengthFt, widthFt) {
  return lengthFt * widthFt;
}

export function volumeFt3(lengthFt, widthFt, thicknessIn) {
  return lengthFt * widthFt * inchesToFeet(thicknessIn);
}

export function applyWaste(value, wastePercent) {
  return value * (1 + wastePercent / 100);
}

export function toUnit(value, unit) {
  switch (unit) {
    case 'ft':
      return value;
    case 'm':
      return feetToMeters(value);
    default:
      return value;
  }
}

export function parseNumber(input) {
  if (input === '' || input === null || input === undefined) {
    return null;
  }
  const value = Number(String(input).replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}
