import { useState } from 'react';
import { formatters } from '../../utils/formatters.js';
import { orderService } from '../../services/orderService.js';

export function FundOrderModal({ order, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleFund = async () => {
    if (!privateKey || !privateKey.trim()) {
      setError('Please enter your private key');
      return;
    }

    if (!privateKey.startsWith('0x')) {
      setError('Private key must start with 0x');
      return;
    }

    if (privateKey.length !== 66) {
      setError('Invalid private key format. Must be 66 characters (0x + 64 hex characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await orderService.fundOrder(order.id, privateKey.trim());
      
      if (onSuccess) {
        onSuccess(result);
      }
      setPrivateKey('');
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

          <div className="private-key-input">
            <div className="form-group">
              <label htmlFor="privateKey">Private Key</label>
              <div className="input-with-toggle">
                <input
                  id="privateKey"
                  type={showPrivateKey ? 'text' : 'password'}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="0x..."
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  disabled={loading}
                >
                  {showPrivateKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="input-hint">
                Enter your private key to fund this order. This will be sent to the backend for transaction signing.
              </p>
            </div>
            <button onClick={handleFund} className="btn-primary" disabled={loading || !privateKey.trim()}>
              {loading ? 'Processing...' : 'Fund Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
