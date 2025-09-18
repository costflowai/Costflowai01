let pricingCache = null;

const clone = (value) =>
  (typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)));

const defaultPricing = {
  materials: {
    concrete: {
      unit: 'yd³',
      unitPrice: 145
    },
    rebar: {
      '#4': {
        unit: 'ft',
        unitPrice: 0.72
      }
    }
  },
  labor: {
    unit: 'hr',
    rate: 68,
    productivityYd3PerHr: 3
  },
  equipment: {
    pumpFlat: 425
  },
  financial: {
    markupRate: 0.1,
    taxRate: 0.0825
  },
  regions: {
    National: 1,
    Northeast: 1.08,
    Southeast: 0.96,
    Midwest: 0.94,
    Mountain: 1.05,
    Pacific: 1.12
  }
};

const fetchPricing = async () => {
  if (pricingCache) return pricingCache;
  try {
    const response = await fetch('/assets/data/pricing.base.json', {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Pricing fetch failed');
    pricingCache = await response.json();
  } catch (error) {
    console.warn('Falling back to embedded pricing', error);
    pricingCache = clone(defaultPricing);
  }
  return pricingCache;
};

export const getRegions = async () => {
  const pricing = await fetchPricing();
  return pricing.regions;
};

export const getPricing = async (region = 'National') => {
  const pricing = await fetchPricing();
  const multiplier = pricing.regions[region] ?? 1;
  const data = clone(pricing);
  data.multiplier = multiplier;
  data.materials.concrete.unitPrice = Number(
    (data.materials.concrete.unitPrice * multiplier).toFixed(2)
  );
  data.materials.rebar['#4'].unitPrice = Number(
    (data.materials.rebar['#4'].unitPrice * multiplier).toFixed(2)
  );
  data.labor.rate = Number((data.labor.rate * multiplier).toFixed(2));
  data.equipment.pumpFlat = Number((data.equipment.pumpFlat * multiplier).toFixed(2));
  return data;
};

export const formatRegionLabel = (region) => {
  if (region === 'National') return 'National Baseline';
  return `${region} (${Math.round(((pricingCache?.regions?.[region] ?? 1) - 1) * 100)}%)`;
};

export const clearPricingCache = () => {
  pricingCache = null;
};

export default {
  getPricing,
  getRegions,
  formatRegionLabel,
  clearPricingCache
};
