export function OrderStatusBadge({ status }) {
  const statusConfig = {
    PendingPayment: { label: 'Pending Payment', color: '#a0a0a0' },
    PaymentSecured: { label: 'Payment Secured', color: '#4a90e2' },
    PreparingShipment: { label: 'Preparing Shipment', color: '#f5a623' },
    InTransit: { label: 'In Transit', color: '#ff8c00' },
    Delivered: { label: 'Delivered', color: '#51cf66' },
    BuyerConfirmed: { label: 'Confirmed', color: '#95e1d3' },
    Completed: { label: 'Completed', color: '#2d8659' },
  };

  const config = statusConfig[status] || { label: status, color: '#a0a0a0' };

  return (
    <span className="order-status-badge" style={{ backgroundColor: config.color }}>
      {config.label}
    </span>
  );
}
