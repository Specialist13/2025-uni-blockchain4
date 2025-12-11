import express from 'express';
import { BaseController } from '../controllers/BaseController.js';
import { AuthController } from '../controllers/AuthController.js';

const router = express.Router();

router.post(
  '/register',
  BaseController.handleAsync(AuthController.register)
);

router.post(
  '/login',
  BaseController.handleAsync(AuthController.login)
);

router.post(
  '/logout',
  BaseController.requireAuth(),
  BaseController.handleAsync(AuthController.logout)
);

export default router;
