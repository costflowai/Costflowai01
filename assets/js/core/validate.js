const validators = {
  number({ value, min, max, required }) {
    if (value === null || value === undefined || value === '') {
      if (required) return { valid: false, message: 'Required field' };
      return { valid: true, value: null };
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return { valid: false, message: 'Enter a number' };
    }
    if (min !== undefined && numeric < min) {
      return { valid: false, message: `Must be ≥ ${min}` };
    }
    if (max !== undefined && numeric > max) {
      return { valid: false, message: `Must be ≤ ${max}` };
    }
    return { valid: true, value: numeric };
  },
  select({ value, options, required }) {
    if (!value) {
      if (required) return { valid: false, message: 'Choose an option' };
      return { valid: true, value: null };
    }
    if (options && !options.includes(value)) {
      return { valid: false, message: 'Invalid option' };
    }
    return { valid: true, value };
  },
  boolean({ value }) {
    return { valid: true, value: Boolean(value) };
  }
};

export function validate(schema, formData) {
  const state = {};
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const validator = validators[rules.type];
    if (!validator) continue;
    const { valid, value, message } = validator({
      value: formData.get(key),
      ...rules
    });
    if (!valid) {
      errors.push({ field: key, message });
    } else {
      state[key] = value;
    }
  }

  return { valid: errors.length === 0, state, errors };
}
