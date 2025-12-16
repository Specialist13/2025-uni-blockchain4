import express from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { ExampleController } from '../controllers/ExampleController.js';
import authRoutes from './auth.js';
import productRoutes from './products.js';
import orderRoutes from './orders.js';
import escrowRoutes from './escrows.js';
import shipmentRoutes from './shipments.js';
import adminRoutes from './admin.js';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Product routes
router.use('/products', productRoutes);

// Order routes
router.use('/orders', orderRoutes);

// Escrow routes
router.use('/escrows', escrowRoutes);

// Shipment routes
router.use('/shipments', shipmentRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Public route example
router.get('/public', BaseController.handleAsync(ExampleController.getPublicData));

// Protected route example (requires JWT authentication)
router.get(
  '/protected',
  BaseController.requireAuth(),
  BaseController.handleAsync(ExampleController.getProtectedData)
);

export default router;
