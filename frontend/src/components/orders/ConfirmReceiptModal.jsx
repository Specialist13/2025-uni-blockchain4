import { useState } from 'react';
import { orderService } from '../../services/orderService.js';

export function ConfirmReceiptModal({ order, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const handleConfirm = async () => {
    if (!privateKey || !privateKey.trim()) {
      setError('Please enter your private key');
      return;
    }

    let normalizedKey = privateKey.trim();
    if (!normalizedKey.startsWith('0x')) {
      normalizedKey = '0x' + normalizedKey;
    }

    if (normalizedKey.length !== 66) {
      setError('Invalid private key format. Must be 66 characters (0x + 64 hex characters)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await orderService.confirmReceipt(order.id, normalizedKey);
      
      if (onSuccess) {
        onSuccess(result);
      }
      setPrivateKey('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirm Receipt</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="confirm-receipt-info">
            <p>Please confirm that you have received the order and are satisfied with the product.</p>
            <p className="warning-text">
              ⚠️ Once confirmed, the payment will be released to the seller.
            </p>
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
                Enter your private key to confirm receipt. This will be sent to the backend for transaction signing.
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={onClose} className="btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button onClick={handleConfirm} className="btn-primary" disabled={loading || !privateKey.trim()}>
                {loading ? 'Confirming...' : 'Confirm Receipt'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
