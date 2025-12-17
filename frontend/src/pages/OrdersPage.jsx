import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';
import { orderService } from '../services/orderService.js';
import { OrderList } from '../components/orders/OrderList.jsx';
import { OrderStatusBadge } from '../components/orders/OrderStatusBadge.jsx';

function OrdersPageContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'all';
    const statusFromUrl = searchParams.get('status') || '';
    setActiveTab(tabFromUrl);
    setStatusFilter(statusFromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (!user?.walletAddress) {
      navigate('/profile');
      return;
    }
    loadOrders();
  }, [searchParams, user]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const status = searchParams.get('status') || undefined;

      const options = {
        page,
        limit: 12,
        status,
      };

      const result = await orderService.listOrders(options);
      setOrders(result.orders || []);
      setPagination({
        page: result.pagination?.page || page,
        totalPages: result.pagination?.totalPages || 1,
        total: result.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buyerOrders = orders.filter(order => 
    order.buyer?.toLowerCase() === user?.walletAddress?.toLowerCase()
  );
  const sellerOrders = orders.filter(order => 
    order.seller?.toLowerCase() === user?.walletAddress?.toLowerCase()
  );

  const displayOrders = activeTab === 'purchases' ? buyerOrders : 
                        activeTab === 'sales' ? sellerOrders : 
                        orders;

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
      </div>

      <div className="orders-tabs">
        <button
          onClick={() => handleTabChange('all')}
          className={activeTab === 'all' ? 'active' : ''}
        >
          All Orders
        </button>
        <button
          onClick={() => handleTabChange('purchases')}
          className={activeTab === 'purchases' ? 'active' : ''}
        >
          My Purchases ({buyerOrders.length})
        </button>
        <button
          onClick={() => handleTabChange('sales')}
          className={activeTab === 'sales' ? 'active' : ''}
        >
          My Sales ({sellerOrders.length})
        </button>
      </div>

      <div className="orders-filters">
        <label>Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PendingPayment">Pending Payment</option>
          <option value="PaymentSecured">Payment Secured</option>
          <option value="PreparingShipment">Preparing Shipment</option>
          <option value="InTransit">In Transit</option>
          <option value="Delivered">Delivered</option>
          <option value="BuyerConfirmed">Buyer Confirmed</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : (
        <>
          <OrderList orders={displayOrders} />
          
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}
