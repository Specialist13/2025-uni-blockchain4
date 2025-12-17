export const sanitize = {
  string: (value) => {
    if (typeof value !== 'string') return '';
    return value
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  },

  html: (value) => {
    if (typeof value !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  },

  email: (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
  },

  number: (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  },

  walletAddress: (value) => {
    if (typeof value !== 'string') return '';
    const cleaned = value.trim();
    if (cleaned.startsWith('0x') && /^0x[a-fA-F0-9]{40}$/.test(cleaned)) {
      return cleaned;
    }
    return '';
  },

  url: (value) => {
    if (typeof value !== 'string') return '';
    try {
      const url = new URL(value);
      return url.toString();
    } catch {
      return '';
    }
  },
};
