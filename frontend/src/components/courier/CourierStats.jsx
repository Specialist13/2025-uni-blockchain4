export function CourierStats({ stats }) {
  if (!stats) {
    return <div className="loading">Loading stats...</div>;
  }

  const statCards = [
    { label: 'Total Shipments', value: stats.total || 0, color: '#6b6b6b' },
    { label: 'Active', value: stats.active || 0, color: '#4a90e2' },
    { label: 'Assigned', value: stats.assigned || 0, color: '#f5a623' },
    { label: 'In Transit', value: stats.inTransit || 0, color: '#ff8c00' },
    { label: 'Delivered', value: stats.delivered || 0, color: '#51cf66' },
  ];

  return (
    <div className="courier-stats">
      {statCards.map((stat, index) => (
        <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
