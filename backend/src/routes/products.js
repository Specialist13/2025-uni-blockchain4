import express from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { ProductController } from '../controllers/ProductController.js';

const router = express.Router();

router.get(
  '/',
  BaseController.handleAsync(ProductController.listProducts)
);

router.get(
  '/:id',
  BaseController.handleAsync(ProductController.getProduct)
);

router.post(
  '/',
  BaseController.requireAuth(),
  BaseController.handleAsync(ProductController.createProduct)
);

router.put(
  '/:id',
  BaseController.requireAuth(),
  BaseController.handleAsync(ProductController.updateProduct)
);

router.delete(
  '/:id',
  BaseController.requireAuth(),
  BaseController.handleAsync(ProductController.deactivateProduct)
);

export default router;
