import { useState } from 'react';
import { useWeb3 } from '../../context/Web3Context.jsx';
import { formatters } from '../../utils/formatters.js';
import { orderService } from '../../services/orderService.js';

export function FundOrderModal({ order, onClose, onSuccess }) {
  const { connectWallet, account, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('connect');

  const handleConnect = async () => {
    const result = await connectWallet();
    if (result.success) {
      setStep('confirm');
    } else {
      setError(result.error);
    }
  };

  const handleFund = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await orderService.fundOrder(order.id);
      
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fund order');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = order.product?.price || 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Fund Order</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="fund-order-info">
            <div className="info-row">
              <span>Product:</span>
              <span>{order.product?.title}</span>
            </div>
            <div className="info-row">
              <span>Price:</span>
              <span>{formatters.formatETH(order.product?.price || 0)}</span>
            </div>
            <div className="info-row">
              <span>Total Amount:</span>
              <span className="total-amount">{formatters.formatETH(totalAmount)}</span>
            </div>
          </div>

          {!isConnected ? (
            <div className="wallet-connect">
              <p>Connect your MetaMask wallet to fund this order</p>
              <button onClick={handleConnect} className="btn-primary" disabled={loading}>
                Connect MetaMask
              </button>
            </div>
          ) : (
            <div className="wallet-connected">
              <p>Connected: {formatters.formatAddress(account)}</p>
              <button onClick={handleFund} className="btn-primary" disabled={loading}>
                {loading ? 'Processing...' : 'Fund Order'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
