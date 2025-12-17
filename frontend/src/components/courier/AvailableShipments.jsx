import { useState, useEffect } from 'react';
import { shipmentService } from '../../services/shipmentService.js';
import { ShipmentActionCard } from './ShipmentActionCard.jsx';

export function AvailableShipments({ onUpdate }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await shipmentService.listAvailableShipments();
      setShipments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load available shipments');
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (shipmentId) => {
    setActionLoading(shipmentId);
    setError('');

    try {
      await shipmentService.confirmPickup(shipmentId);
      await loadShipments();
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm pickup');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading available shipments...</div>;
  }

  if (error && shipments.length === 0) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="available-shipments">
      {error && <div className="error-message">{error}</div>}
      
      {shipments.length === 0 ? (
        <div className="empty-state">
          <p>No available shipments at the moment</p>
        </div>
      ) : (
        <div className="shipment-action-list">
          {shipments.map((shipment) => (
            <ShipmentActionCard
              key={shipment.id}
              shipment={shipment}
              onPickup={handlePickup}
              loading={actionLoading === shipment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
