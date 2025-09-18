import assert from 'node:assert/strict';
import { compute as computeConcrete } from '../src/assets/js/calculators/concrete.js';
import { compute as computeFraming } from '../src/assets/js/calculators/framing.js';
import { compute as computePaint } from '../src/assets/js/calculators/paint.js';
import { toCSV } from '../src/assets/js/core/export.js';
import { getPricingSync } from '../src/assets/js/core/pricing.js';

function logSuccess(message) {
  process.stdout.write(`\u2714\ufe0f  ${message}\n`);
}

(function testConcrete() {
  const result = computeConcrete({
    lengthFt: 20,
    widthFt: 10,
    thicknessIn: 4,
    psi: 3500,
    pourType: 'slab',
    rebarType: 'standard',
    deliveryType: 'truck',
    region: 'US_DEFAULT'
  });
  assert.ok(result && !result.errors, 'Concrete should return results');
  assert.ok(result.results.adjustedYards > 2.4 && result.results.adjustedYards < 2.8, 'Adjusted yards within expected range');
  assert.ok(result.results.totalCost > 0, 'Total cost should be positive');
  logSuccess('Concrete calculator returns volume and positive cost');
})();

(function testFraming() {
  const result = computeFraming({
    wallLengthFt: 12,
    wallHeightFt: 8,
    spacing: '16',
    lumberSize: '2x4',
    region: 'US_DEFAULT'
  });
  assert.ok(result && !result.errors, 'Framing should return results');
  assert.ok(result.results.studCount >= 10, 'Framing stud count >= 10');
  assert.ok(result.results.totalCost > 0, 'Framing cost positive');
  logSuccess('Framing calculator yields studs and cost > 0');
})();

(function testPaint() {
  const result = computePaint({
    wallAreaSqFt: 600,
    openingsSqFt: 40,
    coats: 2,
    texture: 'smooth',
    quality: 'premium',
    includePrimer: true,
    region: 'US_DEFAULT'
  });
  assert.ok(result && !result.errors, 'Paint should return results');
  assert.ok(result.results.gallonsNeeded > 0, 'Gallons needed should be > 0');
  assert.ok(!Number.isNaN(result.results.paintCost), 'Paint cost must not be NaN');
  logSuccess('Paint calculator computes gallons and cost without NaN');
})();

(function testExports() {
  const result = computeConcrete({
    lengthFt: 18,
    widthFt: 12,
    thicknessIn: 5,
    psi: 4000,
    pourType: 'slab',
    rebarType: 'standard',
    deliveryType: 'truck',
    region: 'US_DEFAULT'
  });
  const csv = toCSV({
    type: 'concrete',
    inputs: result.inputs,
    results: result.results
  });
  assert.ok(csv.includes('Result: totalCost'), 'CSV includes total cost');
  assert.ok(csv.split('\n').length > 2, 'CSV has multiple rows');
  logSuccess('CSV export contains total cost row');
})();

(function testRegionPricing() {
  const { multiplier } = getPricingSync('concrete', 'ca');
  assert.ok(multiplier > 1, 'California multiplier should be > 1');
  const defaultMultiplier = getPricingSync('concrete', 'US_DEFAULT').multiplier;
  assert.ok(multiplier !== defaultMultiplier, 'Regional override adjusts multiplier');
  logSuccess('Regional pricing overrides apply');
})();

logSuccess('All calculator smoke tests passed');
