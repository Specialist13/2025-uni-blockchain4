export const validators = {
  required: (value, fieldName = 'Field') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  minLength: (min) => (value, fieldName = 'Field') => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max) => (value, fieldName = 'Field') => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  },

  positiveNumber: (value, fieldName = 'Field') => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  walletAddress: (value) => {
    if (!value) return null;
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(value)) {
      return 'Please enter a valid Ethereum wallet address';
    }
    return null;
  },

  validate: (value, rules, fieldName) => {
    for (const rule of rules) {
      const error = typeof rule === 'function' ? rule(value, fieldName) : null;
      if (error) return error;
    }
    return null;
  },
};
