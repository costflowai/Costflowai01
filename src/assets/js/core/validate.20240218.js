/**
 * Tiny schema validator tailored for calculator inputs.
 */

function applyRule(value, rule) {
  const numberValue = Number(value);
  if (rule.type === 'number') {
    if (Number.isNaN(numberValue)) {
      return rule.message || 'Value must be a number';
    }
    if (rule.min != null && numberValue < rule.min) {
      return rule.message || `Value must be ≥ ${rule.min}`;
    }
    if (rule.max != null && numberValue > rule.max) {
      return rule.message || `Value must be ≤ ${rule.max}`;
    }
  }
  if (rule.type === 'enum') {
    if (!rule.options.includes(value)) {
      return rule.message || `Value must be one of: ${rule.options.join(', ')}`;
    }
  }
  if (rule.type === 'boolean') {
    if (typeof value !== 'boolean') {
      return rule.message || 'Value must be true or false';
    }
  }
  return null;
}

export function validate(values, schema) {
  const errors = {};
  Object.entries(schema).forEach(([key, rules]) => {
    const value = values[key];
    const rulesArray = Array.isArray(rules) ? rules : [rules];
    for (const rule of rulesArray) {
      const error = applyRule(value, rule);
      if (error) {
        errors[key] = error;
        break;
      }
    }
  });
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export default {
  validate
};
