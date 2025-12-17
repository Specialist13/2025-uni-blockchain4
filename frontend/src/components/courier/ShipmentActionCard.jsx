import { ShipmentStatusBadge } from '../shipments/ShipmentStatusBadge.jsx';
import { formatters } from '../../utils/formatters.js';

export function ShipmentActionCard({ shipment, onPickup, onDelivery, loading = false }) {
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [
      address.name,
      address.line1,
      address.line2,
      `${address.city}, ${address.state} ${address.postalCode || address.zip || ''}`,
      address.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="shipment-action-card">
      <div className="shipment-action-header">
        <div>
          <h3>Shipment #{shipment.id}</h3>
          {shipment.trackingNumber && (
            <p className="tracking-number">Tracking: {shipment.trackingNumber}</p>
          )}
        </div>
        <ShipmentStatusBadge status={shipment.status} />
      </div>

      <div className="shipment-action-content">
        {shipment.pickup && (
          <div className="address-section">
            <strong>Pickup:</strong>
            <p>{formatAddress(shipment.pickup)}</p>
          </div>
        )}

        {shipment.dropoff && (
          <div className="address-section">
            <strong>Delivery:</strong>
            <p>{formatAddress(shipment.dropoff)}</p>
          </div>
        )}

        {shipment.order && (
          <div className="order-info">
            <strong>Order:</strong>
            <span>#{shipment.order.id || shipment.orderId}</span>
          </div>
        )}
      </div>

      <div className="shipment-action-buttons">
        {shipment.status === 'Assigned' && onPickup && (
          <button
            onClick={() => onPickup(shipment.id)}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Pickup'}
          </button>
        )}

        {shipment.status === 'InTransit' && onDelivery && (
          <button
            onClick={() => onDelivery(shipment.id)}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Confirm Delivery'}
          </button>
        )}
      </div>
    </div>
  );
}
