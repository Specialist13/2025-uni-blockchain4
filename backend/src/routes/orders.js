import express from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { OrderController } from '../controllers/OrderController.js';

const router = express.Router();

router.get(
  '/',
  BaseController.requireAuth(),
  BaseController.handleAsync(OrderController.listOrders)
);

router.get(
  '/:id',
  BaseController.requireAuth(),
  BaseController.handleAsync(OrderController.getOrder)
);

router.post(
  '/',
  BaseController.requireAuth(),
  BaseController.handleAsync(OrderController.createOrder)
);

router.post(
  '/:id/fund',
  BaseController.requireAuth(),
  BaseController.handleAsync(OrderController.fundOrder)
);

router.post(
  '/:id/ship',
  BaseController.requireAuth(),
  BaseController.handleAsync(OrderController.markReadyToShip)
);

router.post(
  '/:id/confirm',
  BaseController.requireAuth(),
  BaseController.handleAsync(OrderController.confirmReceipt)
);

export default router;
