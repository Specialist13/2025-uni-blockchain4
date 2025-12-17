import { useState } from 'react';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { AssignedShipments } from '../components/courier/AssignedShipments.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function MyShipmentsPageContent() {
  const { isCourier, loading } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

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
    <div className="my-shipments-page">
      <div className="page-header">
        <h1>My Shipments</h1>
        <p>Your assigned shipments</p>
      </div>

      <div className="shipments-filters">
        <label>Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Assigned">Assigned</option>
          <option value="InTransit">In Transit</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      <AssignedShipments statusFilter={statusFilter} />
    </div>
  );
}

export function MyShipmentsPage() {
  return (
    <ProtectedRoute>
      <MyShipmentsPageContent />
    </ProtectedRoute>
  );
}
