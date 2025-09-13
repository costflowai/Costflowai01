/**
 * Calculator Registry - Central registration and dispatch system
 */

export const register = {};

export function registerCalculator(key, impl) {
  register[key] = impl;
  console.log(`Registered calculator: ${key}`);
}

export function compute(key, inputs) {
  const calculator = register[key];
  if (!calculator || typeof calculator.compute !== 'function') {
    console.warn(`Calculator '${key}' not found or missing compute function`);
    return null;
  }
  
  try {
    return calculator.compute(inputs);
  } catch (error) {
    console.error(`Error computing ${key}:`, error);
    return null;
  }
}

export function getFormula(key) {
  const calculator = register[key];
  return calculator?.formula || null;
}

export function listCalculators() {
  return Object.keys(register);
}