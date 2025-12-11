import express from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { ExampleController } from '../controllers/ExampleController.js';
import authRoutes from './auth.js';

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Public route example
router.get('/public', BaseController.handleAsync(ExampleController.getPublicData));

// Protected route example (requires JWT authentication)
router.get(
  '/protected',
  BaseController.requireAuth(),
  BaseController.handleAsync(ExampleController.getProtectedData)
);

// Placeholder routes - will be implemented
router.get('/products', (req, res) => {
  res.json({ message: 'Products endpoint - to be implemented' });
});

router.get('/orders', (req, res) => {
  res.json({ message: 'Orders endpoint - to be implemented' });
});

export default router;
