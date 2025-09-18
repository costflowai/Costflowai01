const FEET_PER_METER = 3.28084;
const INCHES_PER_FOOT = 12;
const YARDS_PER_FOOT = 1 / 3;

const round = (value, precision = 4) => {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

export const toFeet = (value, unit = 'ft') => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  switch (unit) {
    case 'm':
      return numeric * FEET_PER_METER;
    case 'yd':
      return numeric / YARDS_PER_FOOT;
    case 'in':
      return numeric / INCHES_PER_FOOT;
    case 'ft':
    default:
      return numeric;
  }
};

export const toInches = (value, unit = 'in') => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 0;
  switch (unit) {
    case 'm':
      return numeric * FEET_PER_METER * INCHES_PER_FOOT;
    case 'ft':
      return numeric * INCHES_PER_FOOT;
    case 'cm':
      return numeric / 2.54;
    case 'in':
    default:
      return numeric;
  }
};

export const toCubicYardsFromFeet = (volumeFt3) => round(volumeFt3 / 27, 4);

export const formatNumber = (value, options = {}) => {
  const { maximumFractionDigits = 2, minimumFractionDigits = 0 } = options;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits
  }).format(Number.isFinite(value) ? value : 0);
};

export const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);

export const convertLengthForDisplay = (valueFt, units = 'imperial') => {
  if (units === 'metric') {
    const meters = valueFt / FEET_PER_METER;
    return round(meters, 3);
  }
  return round(valueFt, 2);
};

export const convertThicknessForDisplay = (valueIn, units = 'imperial') => {
  if (units === 'metric') {
    const centimeters = valueIn * 2.54;
    return round(centimeters, 2);
  }
  return round(valueIn, 2);
};

export const convertVolumeForDisplay = (valueYd3, units = 'imperial') => {
  if (units === 'metric') {
    const cubicMeters = valueYd3 * 0.764555;
    return round(cubicMeters, 3);
  }
  return round(valueYd3, 3);
};

export const unitsConfig = Object.freeze({
  imperial: {
    label: 'Imperial (ft/in)',
    lengthPlaceholder: 'ft',
    thicknessPlaceholder: 'in'
  },
  metric: {
    label: 'Metric (m/cm)',
    lengthPlaceholder: 'm',
    thicknessPlaceholder: 'cm'
  }
});

export default {
  toFeet,
  toInches,
  toCubicYardsFromFeet,
  formatNumber,
  formatCurrency,
  convertLengthForDisplay,
  convertThicknessForDisplay,
  convertVolumeForDisplay,
  unitsConfig
};
