/**
 * Pricing table management. Data is stored in /assets/data but duplicated
 * here as a fallback so unit tests can run without performing fetches.
 */

const BASE_DATA = {
  concrete: {
    material: 140,
    labor: 48,
    reinforcementPerSqFt: 0.85,
    pumpFlatFee: 175
  },
  framing: {
    stud8ft: 4.25,
    stud10ft: 5.4,
    sheathingPerSqFt: 1.6,
    hardwarePerSqFt: 0.55,
    laborPerSqFt: 3.25
  },
  paint: {
    gallonPremium: 48,
    gallonStandard: 32,
    primerGallon: 24,
    laborPerSqFt: 1.35
  }
};

const REGION_MULTIPLIERS = {
  US_DEFAULT: 1,
  nc: 0.94,
  tx: 0.9,
  ca: 1.32,
  ny: 1.22,
  fl: 1.05,
  midwest: 0.88,
  'west-coast': 1.28
};

const regionCache = new Map();
let basePricing = null;

function normaliseRegion(region) {
  if (!region) return 'US_DEFAULT';
  const key = region.toString().toLowerCase();
  if (key === 'us_default' || key === 'default') return 'US_DEFAULT';
  if (REGION_MULTIPLIERS[key] != null) return key;
  return 'US_DEFAULT';
}

async function loadJSON(path) {
  if (typeof fetch === 'function') {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      console.warn('Unable to fetch pricing data', error);
    }
  }
  return null;
}

async function ensureBasePricing() {
  if (basePricing) return basePricing;
  const loaded = await loadJSON('/assets/data/pricing.base.json');
  basePricing = loaded || BASE_DATA;
  return basePricing;
}

async function ensureRegion(regionKey) {
  if (regionCache.has(regionKey)) {
    return regionCache.get(regionKey);
  }
  const loaded = await loadJSON(`/assets/data/regions/${regionKey}.json`);
  const fallback = REGION_MULTIPLIERS[regionKey] || 1;
  const multiplier = loaded?.multiplier ?? fallback;
  regionCache.set(regionKey, multiplier);
  return multiplier;
}

export async function getPricing(calculator, region = 'US_DEFAULT') {
  const pricingData = await ensureBasePricing();
  const regionKey = normaliseRegion(region);
  const multiplier = await ensureRegion(regionKey);
  const calculatorPricing = pricingData[calculator];
  if (!calculatorPricing) {
    console.warn(`Missing pricing config for ${calculator}`);
    return { data: {}, multiplier: 1 };
  }
  return {
    data: calculatorPricing,
    multiplier
  };
}

export function getPricingSync(calculator, region = 'US_DEFAULT') {
  const regionKey = normaliseRegion(region);
  const base = basePricing || BASE_DATA;
  const multiplier = regionCache.get(regionKey) ?? REGION_MULTIPLIERS[regionKey] ?? 1;
  const calculatorPricing = base[calculator] || {};
  if (!regionCache.has(regionKey)) {
    regionCache.set(regionKey, multiplier);
  }
  return {
    data: calculatorPricing,
    multiplier
  };
}

export function overridePricing(nextPricing) {
  basePricing = { ...BASE_DATA, ...nextPricing };
}

export default {
  getPricing,
  getPricingSync,
  overridePricing
};
