export const formatters = {
  formatETH(value) {
    if (!value && value !== 0) return '0 ETH';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0 ETH';
    return `${num.toFixed(4)} ETH`;
  },

  formatAddress(address) {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },
};
