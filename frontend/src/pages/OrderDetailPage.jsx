import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { orderService } from '../services/orderService.js';
import { OrderDetail } from '../components/orders/OrderDetail.jsx';

function OrderDetailPageContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const orderData = await orderService.getOrder(id);
      setOrder(orderData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    loadOrder();
  };

  if (loading) {
    return <div className="loading">Loading order...</div>;
  }

  if (error || !order) {
    return (
      <div className="error-page">
        <h2>Order Not Found</h2>
        <p>{error || 'The order you are looking for does not exist.'}</p>
        <button onClick={() => navigate('/orders')} className="btn-primary">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <button onClick={() => navigate(-1)} className="btn-back">
        ← Back
      </button>
      <OrderDetail order={order} onUpdate={handleUpdate} />
    </div>
  );
}

export function OrderDetailPage() {
  return (
    <ProtectedRoute>
      <OrderDetailPageContent />
    </ProtectedRoute>
  );
}
