import { useState, useEffect } from 'react';
import { CourierStats } from './CourierStats.jsx';
import { ShipmentActionCard } from './ShipmentActionCard.jsx';
import { shipmentService } from '../../services/shipmentService.js';
import { Link } from 'react-router-dom';

export function CourierDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await shipmentService.getCourierDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!dashboard) {
    return <div className="empty-state">No dashboard data available</div>;
  }

  const activeShipments = dashboard.activeShipments || [];
  const recentShipments = dashboard.recentShipments || [];

  return (
    <div className="courier-dashboard">
      <div className="dashboard-header">
        <h1>Courier Dashboard</h1>
        <div className="dashboard-actions">
          <Link to="/courier/available" className="btn-primary">
            View Available Shipments
          </Link>
          <Link to="/courier/pickup" className="btn-primary">
            Confirm Pickup
          </Link>
          <Link to="/courier/delivery" className="btn-primary">
            Confirm Delivery
          </Link>
        </div>
      </div>

      <CourierStats stats={dashboard.stats} />

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h2>Active Shipments</h2>
          {activeShipments.length === 0 ? (
            <div className="empty-state">
              <p>No active shipments</p>
            </div>
          ) : (
            <div className="shipment-action-list">
              {activeShipments.slice(0, 5).map((shipment) => (
                <ShipmentActionCard
                  key={shipment.id}
                  shipment={shipment}
                />
              ))}
            </div>
          )}
          {activeShipments.length > 5 && (
            <Link to="/courier/shipments" className="view-all-link">
              View all active shipments →
            </Link>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Recent Shipments</h2>
          {recentShipments.length === 0 ? (
            <div className="empty-state">
              <p>No recent shipments</p>
            </div>
          ) : (
            <div className="shipment-action-list">
              {recentShipments.slice(0, 5).map((shipment) => (
                <ShipmentActionCard
                  key={shipment.id}
                  shipment={shipment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
