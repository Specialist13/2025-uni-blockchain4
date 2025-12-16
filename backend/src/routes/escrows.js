import express from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { EscrowController } from '../controllers/EscrowController.js';

const router = express.Router();

router.get(
  '/:id',
  BaseController.requireAuth(),
  BaseController.handleAsync(EscrowController.getEscrow)
);

export default router;
