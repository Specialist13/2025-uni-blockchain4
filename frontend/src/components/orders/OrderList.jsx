import { OrderCard } from './OrderCard.jsx';

export function OrderList({ orders }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="empty-state">
        <p>No orders found</p>
      </div>
    );
  }

  return (
    <div className="order-list">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
