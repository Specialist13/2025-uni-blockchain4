import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { AssignedShipments } from '../components/courier/AssignedShipments.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { shipmentService } from '../services/shipmentService.js';
import { ShipmentActionCard } from '../components/courier/ShipmentActionCard.jsx';
import { useState } from 'react';

function ConfirmPickupPageContent() {
  const { isCourier, loading } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isCourier()) {
      navigate('/');
    }
  }, [loading, isCourier, navigate]);

  useEffect(() => {
    if (isCourier()) {
      loadShipments();
    }
  }, [isCourier]);

  const loadShipments = async () => {
    try {
      setPageLoading(true);
      setError('');
      const data = await shipmentService.listCourierShipments({ status: 'Assigned' });
      setShipments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load shipments');
    } finally {
      setPageLoading(false);
    }
  };

  const handlePickup = async (shipmentId) => {
    setActionLoading(shipmentId);
    setError('');

    try {
      await shipmentService.confirmPickup(shipmentId);
      await loadShipments();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm pickup');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || pageLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isCourier()) {
    return null;
  }

  return (
    <div className="confirm-pickup-page">
      <div className="page-header">
        <h1>Confirm Pickup</h1>
        <p>Shipments assigned to you that need pickup confirmation</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {shipments.length === 0 ? (
        <div className="empty-state">
          <p>No shipments available for pickup confirmation</p>
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

export function ConfirmPickupPage() {
  return (
    <ProtectedRoute>
      <ConfirmPickupPageContent />
    </ProtectedRoute>
  );
}
