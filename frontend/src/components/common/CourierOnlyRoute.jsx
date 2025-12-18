import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function CourierOnlyRoute({ children }) {
  const { isCourier, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isCourier()) {
    return <Navigate to="/courier/dashboard" replace />;
  }

  return children;
}
