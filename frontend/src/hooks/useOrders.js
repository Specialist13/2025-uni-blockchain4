import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/orderService.js';

export function useOrders(options = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchOrders = useCallback(async (fetchOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.listOrders({ ...options, ...fetchOptions });
      setOrders(result.orders || result.items || result);
      if (result.pagination) {
        setPagination(result.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = useCallback(async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const newOrder = await orderService.createOrder(productId);
      return { success: true, order: newOrder };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create order';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const fundOrder = useCallback(async (id, buyerPrivateKey = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.fundOrder(id, buyerPrivateKey);
      setOrders(prev => prev.map(o => o.id === id ? result : o));
      return { success: true, order: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fund order';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const markReadyToShip = useCallback(async (id, senderAddress, recipientAddress) => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.markReadyToShip(id, senderAddress, recipientAddress);
      setOrders(prev => prev.map(o => o.id === id ? result : o));
      return { success: true, order: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to mark ready to ship';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmReceipt = useCallback(async (id, buyerPrivateKey = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await orderService.confirmReceipt(id, buyerPrivateKey);
      setOrders(prev => prev.map(o => o.id === id ? result : o));
      return { success: true, order: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to confirm receipt';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    fetchOrders,
    createOrder,
    fundOrder,
    markReadyToShip,
    confirmReceipt,
  };
}
