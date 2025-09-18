/**
 * Calculator registry responsible for storing calculator implementations.
 * Each calculator exposes { init?, compute, explain }.
 */

const registry = new Map();

export function registerCalculator(key, implementation) {
  registry.set(key, implementation);
}

export function getCalculator(key) {
  return registry.get(key);
}

export function compute(key, inputs) {
  const calculator = getCalculator(key);
  if (!calculator || typeof calculator.compute !== 'function') {
    console.warn(`Calculator '${key}' not found`);
    return null;
  }
  return calculator.compute(inputs);
}

export function explain(key, state) {
  const calculator = getCalculator(key);
  if (!calculator || typeof calculator.explain !== 'function') {
    return '';
  }
  return calculator.explain(state);
}

export function listCalculators() {
  return Array.from(registry.keys());
}

export default {
  registerCalculator,
  getCalculator,
  compute,
  explain,
  listCalculators
};
