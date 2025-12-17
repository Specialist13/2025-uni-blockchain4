import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { CourierDashboard } from '../components/courier/CourierDashboard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function CourierDashboardPageContent() {
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
    <div className="courier-dashboard-page">
      <CourierDashboard />
    </div>
  );
}

export function CourierDashboardPage() {
  return (
    <ProtectedRoute>
      <CourierDashboardPageContent />
    </ProtectedRoute>
  );
}
