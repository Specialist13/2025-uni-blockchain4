import express from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { AdminController } from '../controllers/AdminController.js';

const router = express.Router();

router.post(
  '/couriers',
  BaseController.handleAsync(AdminController.addCourier)
);

export default router;
