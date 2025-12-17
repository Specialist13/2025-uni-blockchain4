import { useState, useEffect, useCallback } from 'react';
import { shipmentService } from '../services/shipmentService.js';

export function useShipments(options = {}) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const fetchAvailableShipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await shipmentService.listAvailableShipments();
      setShipments(Array.isArray(result) ? result : result.shipments || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch available shipments');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourierShipments = useCallback(async (fetchOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await shipmentService.listCourierShipments({ ...options, ...fetchOptions });
      setShipments(Array.isArray(result) ? result : result.shipments || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch shipments');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await shipmentService.getCourierDashboard();
      setDashboard(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPickup = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await shipmentService.confirmPickup(id);
      setShipments(prev => prev.map(s => s.id === id ? result : s));
      return { success: true, shipment: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to confirm pickup';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmDelivery = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await shipmentService.confirmDelivery(id);
      setShipments(prev => prev.map(s => s.id === id ? result : s));
      return { success: true, shipment: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to confirm delivery';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    shipments,
    loading,
    error,
    dashboard,
    fetchAvailableShipments,
    fetchCourierShipments,
    fetchDashboard,
    confirmPickup,
    confirmDelivery,
  };
}
