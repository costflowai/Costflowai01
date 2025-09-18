import basePricing from '../../data/pricing.base.js';
import regionData from '../../data/regions/us.js';

const regionalFactors = new Map(regionData.regions.map((r) => [r.id, r.factor]));

export function getRegions() {
  return regionData.regions;
}

export function resolveRegionFactor(regionId = 'national') {
  return regionalFactors.get(regionId) ?? 1;
}

export function resolvePrice(path, overrides = {}, regionId = 'national') {
  const override = overrides[path];
  if (override !== undefined && override !== null && override !== '') {
    return { value: Number(override), overridden: true };
  }
  const segments = path.split('.');
  let cursor = basePricing;
  for (const segment of segments) {
    cursor = cursor?.[segment];
  }
  const base = Number(cursor ?? 0);
  const factor = resolveRegionFactor(regionId);
  return { value: base * factor, overridden: false };
}

export function describeOverrides(overrides) {
  return Object.entries(overrides)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([path]) => path.replace(/_/g, ' '));
}
