const isRequired = (value) => value !== undefined && value !== null && `${value}`.trim() !== '';
const toNumber = (value) => {
  if (value === '' || value === null || value === undefined) return NaN;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
};

const ruleMessages = {
  required: 'This field is required.',
  positive: 'Enter a value greater than zero.',
  range: (min, max) => `Enter a value between ${min} and ${max}.`
};

export const createValidator = (schema) => {
  const errors = new Map();

  const validateField = (name, value) => {
    const rules = schema[name];
    if (!rules) {
      errors.delete(name);
      return true;
    }

    const fieldErrors = [];
    const numeric = toNumber(value);

    if (rules.required && !isRequired(value)) {
      fieldErrors.push(ruleMessages.required);
    }

    if (rules.numeric && isRequired(value) && Number.isNaN(numeric)) {
      fieldErrors.push('Enter a numeric value.');
    }

    if (rules.positive && isRequired(value) && numeric <= 0) {
      fieldErrors.push(ruleMessages.positive);
    }

    if (rules.min !== undefined && isRequired(value) && numeric < rules.min) {
      fieldErrors.push(ruleMessages.range(rules.min, rules.max ?? '∞'));
    }

    if (rules.max !== undefined && isRequired(value) && numeric > rules.max) {
      fieldErrors.push(ruleMessages.range(rules.min ?? '-∞', rules.max));
    }

    if (rules.options && isRequired(value) && !rules.options.includes(value)) {
      fieldErrors.push('Choose a valid option.');
    }

    if (fieldErrors.length) {
      errors.set(name, fieldErrors);
      return false;
    }

    errors.delete(name);
    return true;
  };

  const validateAll = (values) => {
    let valid = true;
    Object.entries(schema).forEach(([name]) => {
      valid = validateField(name, values[name]) && valid;
    });
    return valid;
  };

  return {
    validateField,
    validateAll,
    getErrors: () => errors,
    getFieldErrors: (name) => errors.get(name) ?? [],
    isValid: () => errors.size === 0
  };
};

export default { createValidator };
