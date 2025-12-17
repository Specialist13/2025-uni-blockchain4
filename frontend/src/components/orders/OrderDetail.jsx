import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { OrderStatusBadge } from './OrderStatusBadge.jsx';
import { FundOrderModal } from './FundOrderModal.jsx';
import { AddressForm } from './AddressForm.jsx';
import { formatters } from '../../utils/formatters.js';
import { orderService } from '../../services/orderService.js';

export function OrderDetail({ order, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showFundModal, setShowFundModal] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isBuyer = user?.walletAddress?.toLowerCase() === order?.buyer?.toLowerCase();
  const isSeller = user?.walletAddress?.toLowerCase() === order?.seller?.toLowerCase();

  const handleFund = () => {
    setShowFundModal(true);
  };

  const handleFundSuccess = () => {
    setShowFundModal(false);
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleMarkReadyToShip = () => {
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async (addressData) => {
    setLoading(true);
    setError('');

    try {
      await orderService.markReadyToShip(order.id, addressData, addressData);
      setShowAddressForm(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to mark as ready to ship');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!window.confirm('Confirm that you have received the order?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await orderService.confirmReceipt(order.id);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm receipt');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTimeline = () => {
    const statuses = [
      'PendingPayment',
      'PaymentSecured',
      'PreparingShipment',
      'InTransit',
      'Delivered',
      'BuyerConfirmed',
      'Completed',
    ];
    const currentIndex = statuses.indexOf(order.status);
    return statuses.map((status, index) => ({
      status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (!order) {
    return <div className="loading">Loading order...</div>;
  }

  const productImage = order.product?.imageUrl || order.product?.imageUrls?.[0];

  return (
    <div className="order-detail">
      {error && <div className="error-message">{error}</div>}

      <div className="order-detail-header">
        <div>
          <h1>Order #{order.id}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="order-detail-content">
        <div className="order-product-info">
          <h2>Product</h2>
          <div className="product-info-card">
            {productImage && (
              <img src={productImage} alt={order.product?.title} className="product-info-image" />
            )}
            <div>
              <h3>{order.product?.title}</h3>
              <p className="product-price">{formatters.formatETH(order.product?.price || 0)}</p>
              {order.product?.description && <p>{order.product.description}</p>}
            </div>
          </div>
        </div>

        <div className="order-info-section">
          <h2>Order Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Buyer:</strong>
              <span>{formatters.formatAddress(order.buyer)}</span>
            </div>
            <div className="info-item">
              <strong>Seller:</strong>
              <span>{formatters.formatAddress(order.seller)}</span>
            </div>
            <div className="info-item">
              <strong>Status:</strong>
              <OrderStatusBadge status={order.status} />
            </div>
            {order.createdAt && (
              <div className="info-item">
                <strong>Created:</strong>
                <span>{formatters.formatDateTime(order.createdAt)}</span>
              </div>
            )}
          </div>
        </div>

        {order.escrow && (
          <div className="order-info-section">
            <h2>Escrow Details</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Escrow ID:</strong>
                <span>{order.escrow.id}</span>
              </div>
              <div className="info-item">
                <strong>Amount:</strong>
                <span>{formatters.formatETH(order.product?.price || 0)}</span>
              </div>
              {order.escrow.fundedAt && (
                <div className="info-item">
                  <strong>Funded:</strong>
                  <span>{formatters.formatDateTime(order.escrow.fundedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {order.shipment && (
          <div className="order-info-section">
            <h2>Shipment Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Tracking Number:</strong>
                <span>{order.shipment.trackingNumber}</span>
              </div>
              <div className="info-item">
                <strong>Status:</strong>
                <span>{order.shipment.status}</span>
              </div>
              {order.shipment.courier && (
                <div className="info-item">
                  <strong>Courier:</strong>
                  <span>{formatters.formatAddress(order.shipment.courier)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="order-info-section">
          <h2>Status Timeline</h2>
          <div className="status-timeline">
            {getStatusTimeline().map((item, index) => (
              <div key={item.status} className={`timeline-item ${item.completed ? 'completed' : ''} ${item.current ? 'current' : ''}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <strong>{item.status}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-actions">
          {isBuyer && order.status === 'PendingPayment' && (
            <button onClick={handleFund} className="btn-primary btn-large">
              Fund Order
            </button>
          )}

          {isBuyer && order.status === 'Delivered' && (
            <button onClick={handleConfirmReceipt} className="btn-primary btn-large" disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm Receipt'}
            </button>
          )}

          {isSeller && order.status === 'PaymentSecured' && (
            <button onClick={handleMarkReadyToShip} className="btn-primary btn-large" disabled={loading}>
              {loading ? 'Processing...' : 'Mark Ready to Ship'}
            </button>
          )}
        </div>
      </div>

      {showFundModal && (
        <FundOrderModal
          order={order}
          onClose={() => setShowFundModal(false)}
          onSuccess={handleFundSuccess}
        />
      )}

      {showAddressForm && (
        <div className="modal-overlay" onClick={() => setShowAddressForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Shipping Address</h2>
              <button onClick={() => setShowAddressForm(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <AddressForm
                onSubmit={handleAddressSubmit}
                onCancel={() => setShowAddressForm(false)}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
