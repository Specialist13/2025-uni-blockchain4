import { useState, useEffect } from 'react';
import { shipmentService } from '../../services/shipmentService.js';
import { ShipmentActionCard } from './ShipmentActionCard.jsx';

export function AssignedShipments({ statusFilter, onUpdate }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadShipments();
  }, [statusFilter]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      setError('');
      const options = {
        status: statusFilter || undefined,
        activeOnly: !statusFilter,
      };
      const data = await shipmentService.listCourierShipments(options);
      setShipments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelivery = async (shipmentId) => {
    setActionLoading(shipmentId);
    setError('');

    try {
      await shipmentService.confirmDelivery(shipmentId);
      await loadShipments();
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm delivery');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading shipments...</div>;
  }

  if (error && shipments.length === 0) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="assigned-shipments">
      {error && <div className="error-message">{error}</div>}
      
      {shipments.length === 0 ? (
        <div className="empty-state">
          <p>No shipments found</p>
        </div>
      ) : (
        <div className="shipment-action-list">
          {shipments.map((shipment) => (
            <ShipmentActionCard
              key={shipment.id}
              shipment={shipment}
              onDelivery={handleDelivery}
              loading={actionLoading === shipment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
