import express from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { ShipmentController } from '../controllers/ShipmentController.js';

const router = express.Router();

router.get(
  '/courier/available',
  BaseController.requireAuth(),
  BaseController.handleAsync(ShipmentController.listAvailableShipments)
);

router.get(
  '/courier/assigned',
  BaseController.requireAuth(),
  BaseController.handleAsync(ShipmentController.listCourierShipments)
);

router.get(
  '/courier/dashboard',
  BaseController.requireAuth(),
  BaseController.handleAsync(ShipmentController.getCourierDashboard)
);

router.get(
  '/:id',
  BaseController.requireAuth(),
  BaseController.handleAsync(ShipmentController.getShipment)
);

router.get(
  '/order/:orderId',
  BaseController.requireAuth(),
  BaseController.handleAsync(ShipmentController.getShipmentByOrderId)
);

router.post(
  '/:id/pickup',
  BaseController.requireAuth(),
  BaseController.handleAsync(ShipmentController.confirmPickup)
);

router.post(
  '/:id/delivery',
  BaseController.requireAuth(),
  BaseController.handleAsync(ShipmentController.confirmDelivery)
);

export default router;
