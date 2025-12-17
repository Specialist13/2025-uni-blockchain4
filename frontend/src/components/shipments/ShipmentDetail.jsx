import { ShipmentStatusBadge } from './ShipmentStatusBadge.jsx';
import { formatters } from '../../utils/formatters.js';

export function ShipmentDetail({ shipment }) {
  if (!shipment) {
    return <div className="loading">Loading shipment...</div>;
  }

  const getStatusTimeline = () => {
    const statuses = ['Assigned', 'InTransit', 'Delivered'];
    const currentIndex = statuses.indexOf(shipment.status);
    return statuses.map((status, index) => ({
      status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    const parts = [
      address.name,
      address.line1,
      address.line2,
      `${address.city}, ${address.state} ${address.postalCode || address.zip || ''}`,
      address.country,
    ].filter(Boolean);
    return parts.join('\n');
  };

  return (
    <div className="shipment-detail">
      <div className="shipment-detail-header">
        <div>
          <h2>Shipment #{shipment.id}</h2>
          <ShipmentStatusBadge status={shipment.status} />
        </div>
      </div>

      <div className="shipment-detail-content">
        {shipment.trackingNumber && (
          <div className="shipment-info-section">
            <h3>Tracking Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Tracking Number:</strong>
                <span>{shipment.trackingNumber}</span>
              </div>
            </div>
          </div>
        )}

        <div className="shipment-info-section">
          <h3>Status Timeline</h3>
          <div className="status-timeline">
            {getStatusTimeline().map((item, index) => (
              <div key={item.status} className={`timeline-item ${item.completed ? 'completed' : ''} ${item.current ? 'current' : ''}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <strong>{item.status}</strong>
                  {item.status === 'Assigned' && shipment.createdAt && (
                    <span className="timeline-date">{formatters.formatDateTime(shipment.createdAt)}</span>
                  )}
                  {item.status === 'InTransit' && shipment.pickedUpAt && (
                    <span className="timeline-date">{formatters.formatDateTime(shipment.pickedUpAt)}</span>
                  )}
                  {item.status === 'Delivered' && shipment.deliveredAt && (
                    <span className="timeline-date">{formatters.formatDateTime(shipment.deliveredAt)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {shipment.pickup && (
          <div className="shipment-info-section">
            <h3>Pickup Address</h3>
            <div className="address-display">
              <pre>{formatAddress(shipment.pickup)}</pre>
            </div>
          </div>
        )}

        {shipment.dropoff && (
          <div className="shipment-info-section">
            <h3>Delivery Address</h3>
            <div className="address-display">
              <pre>{formatAddress(shipment.dropoff)}</pre>
            </div>
          </div>
        )}

        <div className="shipment-info-section">
          <h3>Shipment Information</h3>
          <div className="info-grid">
            {shipment.courier && (
              <div className="info-item">
                <strong>Courier:</strong>
                <span>{formatters.formatAddress(shipment.courier)}</span>
              </div>
            )}
            {shipment.order && (
              <div className="info-item">
                <strong>Order ID:</strong>
                <span>#{shipment.order.id || shipment.orderId}</span>
              </div>
            )}
            {shipment.createdAt && (
              <div className="info-item">
                <strong>Created:</strong>
                <span>{formatters.formatDateTime(shipment.createdAt)}</span>
              </div>
            )}
            {shipment.pickedUpAt && (
              <div className="info-item">
                <strong>Picked Up:</strong>
                <span>{formatters.formatDateTime(shipment.pickedUpAt)}</span>
              </div>
            )}
            {shipment.deliveredAt && (
              <div className="info-item">
                <strong>Delivered:</strong>
                <span>{formatters.formatDateTime(shipment.deliveredAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
