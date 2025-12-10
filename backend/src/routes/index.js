import express from 'express';

const router = express.Router();

// Placeholder routes - will be implemented
router.get('/products', (req, res) => {
  res.json({ message: 'Products endpoint - to be implemented' });
});

router.get('/orders', (req, res) => {
  res.json({ message: 'Orders endpoint - to be implemented' });
});

export default router;
