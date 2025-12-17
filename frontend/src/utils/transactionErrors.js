import { showToast } from './toast.js';

export const handleTransactionError = (error, defaultMessage = 'Transaction failed') => {
  let message = defaultMessage;
  let details = null;

  if (error.response?.data) {
    const errorData = error.response.data;
    
    if (errorData.message) {
      message = errorData.message;
    }
    
    if (errorData.error) {
      details = errorData.error;
    }
    
    if (errorData.details) {
      details = errorData.details;
    }
  } else if (error.message) {
    message = error.message;
  }

  const fullMessage = details ? `${message}: ${details}` : message;
  
  showToast.error(fullMessage);
  
  return {
    message,
    details,
    fullMessage,
  };
};

export const getTransactionErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    if (error.message.includes('revert')) {
      return 'Transaction was rejected. Please check your wallet and try again.';
    }
    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds. Please ensure you have enough ETH to complete the transaction.';
    }
    if (error.message.includes('user rejected')) {
      return 'Transaction was cancelled.';
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};
