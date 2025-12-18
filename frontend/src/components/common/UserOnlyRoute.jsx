import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export function UserOnlyRoute({ children }) {
  const { isCourier, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (isCourier()) {
    return <Navigate to="/courier/dashboard" replace />;
  }

  return children;
}
