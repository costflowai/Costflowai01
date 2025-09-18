import test from 'node:test';
import assert from 'node:assert/strict';

import { calculator as concrete } from '../assets/js/calculators/concrete-slab-pro.js';

const baseState = {
  ...concrete.defaults,
  include_markup: true,
  include_tax: true
};

test('Concrete Slab Pro compute returns positive volumes and totals', () => {
  const result = concrete.compute(baseState);
  assert.ok(result.metrics.volumeFt3 > 0, 'volume in ft³ should be positive');
  assert.ok(result.metrics.volumeYd3Waste > 0, 'waste-adjusted volume should be positive');
  assert.ok(result.totals.total > 0, 'total cost should be positive');
});

test('Concrete Slab Pro export definitions expose CSV/XLSX/PDF payloads', () => {
  const result = concrete.compute(baseState);
  const exports = concrete.export(baseState, result);
  assert.ok(exports.csv?.rows?.length > 0, 'CSV rows should exist');
  assert.equal(exports.csv.filename, 'concrete-slab-pro.csv');
  assert.ok(exports.xlsx?.rows?.length > 0, 'XLSX rows should exist');
  assert.equal(exports.xlsx.filename, 'concrete-slab-pro.xlsx');
  assert.ok(exports.pdf?.lines?.length > 0, 'PDF lines should exist');
  assert.equal(exports.pdf.filename, 'concrete-slab-pro.pdf');
});

test('Concrete Slab Pro explanation includes volume line', () => {
  const result = concrete.compute(baseState);
  const explanation = concrete.explain(baseState, result);
  assert.match(explanation, /Volume/);
  assert.match(explanation, /Total/);
});
