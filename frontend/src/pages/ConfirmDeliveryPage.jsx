import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { shipmentService } from '../services/shipmentService.js';
import { ShipmentActionCard } from '../components/courier/ShipmentActionCard.jsx';

function ConfirmDeliveryPageContent() {
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
      const data = await shipmentService.listCourierShipments({ status: 'InTransit' });
      setShipments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load shipments');
    } finally {
      setPageLoading(false);
    }
  };

  const handleDelivery = async (shipmentId) => {
    setActionLoading(shipmentId);
    setError('');

    try {
      await shipmentService.confirmDelivery(shipmentId);
      await loadShipments();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm delivery');
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
    <div className="confirm-delivery-page">
      <div className="page-header">
        <h1>Confirm Delivery</h1>
        <p>Shipments in transit that need delivery confirmation</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {shipments.length === 0 ? (
        <div className="empty-state">
          <p>No shipments available for delivery confirmation</p>
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

export function ConfirmDeliveryPage() {
  return (
    <ProtectedRoute>
      <ConfirmDeliveryPageContent />
    </ProtectedRoute>
  );
}
