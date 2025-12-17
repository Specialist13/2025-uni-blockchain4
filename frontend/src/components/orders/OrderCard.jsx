import { Link } from 'react-router-dom';
import { OrderStatusBadge } from './OrderStatusBadge.jsx';
import { formatters } from '../../utils/formatters.js';

export function OrderCard({ order }) {
  const productImage = order.product?.imageUrl || order.product?.imageUrls?.[0] || 'https://via.placeholder.com/150?text=No+Image';
  
  return (
    <Link to={`/orders/${order.id}`} className="order-card">
      <div className="order-card-image">
        <img src={productImage} alt={order.product?.title || 'Product'} />
      </div>
      <div className="order-card-content">
        <div className="order-card-header">
          <h3>{order.product?.title || 'Product'}</h3>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="order-card-price">{formatters.formatETH(order.product?.price || 0)}</p>
        <div className="order-card-meta">
          <p>Order #{order.id}</p>
          {order.createdAt && (
            <p>{formatters.formatDate(order.createdAt)}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
