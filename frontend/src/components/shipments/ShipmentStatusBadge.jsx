export function ShipmentStatusBadge({ status }) {
  const statusConfig = {
    Assigned: { label: 'Assigned', color: '#f5a623' },
    InTransit: { label: 'In Transit', color: '#ff8c00' },
    Delivered: { label: 'Delivered', color: '#51cf66' },
  };

  const config = statusConfig[status] || { label: status, color: '#a0a0a0' };

  return (
    <span className="shipment-status-badge" style={{ backgroundColor: config.color }}>
      {config.label}
    </span>
  );
}
