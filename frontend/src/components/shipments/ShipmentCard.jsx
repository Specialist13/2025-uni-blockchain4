import { Link } from 'react-router-dom';
import { ShipmentStatusBadge } from './ShipmentStatusBadge.jsx';
import { formatters } from '../../utils/formatters.js';

export function ShipmentCard({ shipment }) {
  const orderId = shipment.order?.id || shipment.orderId;
  
  return (
    <Link to={`/orders/${orderId}`} className="shipment-card">
      <div className="shipment-card-content">
        <div className="shipment-card-header">
          <h3>Shipment #{shipment.id}</h3>
          <ShipmentStatusBadge status={shipment.status} />
        </div>
        {shipment.trackingNumber && (
          <p className="shipment-tracking">Tracking: {shipment.trackingNumber}</p>
        )}
        {orderId && (
          <p className="shipment-order">Order #{orderId}</p>
        )}
        {shipment.courier && (
          <p className="shipment-courier">
            Courier: {formatters.formatAddress(shipment.courier)}
          </p>
        )}
        {shipment.createdAt && (
          <p className="shipment-date">{formatters.formatDate(shipment.createdAt)}</p>
        )}
      </div>
    </Link>
  );
}
