import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { AvailableShipments } from '../components/courier/AvailableShipments.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function AvailableShipmentsPageContent() {
  const { isCourier, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isCourier()) {
      navigate('/');
    }
  }, [loading, isCourier, navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isCourier()) {
    return null;
  }

  return (
    <div className="available-shipments-page">
      <div className="page-header">
        <h1>Available Shipments</h1>
        <p>Shipments available for pickup</p>
      </div>
      <AvailableShipments />
    </div>
  );
}

export function AvailableShipmentsPage() {
  return (
    <ProtectedRoute>
      <AvailableShipmentsPageContent />
    </ProtectedRoute>
  );
}
