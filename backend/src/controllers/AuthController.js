import { BaseController } from './BaseController.js';
import { AuthService } from '../services/AuthService.js';

export class AuthController extends BaseController {
  static async register(req, res) {
    const { email, password, username, role } = req.body;

    if (!email || !password) {
      return BaseController.badRequest(res, 'Email and password are required');
    }

    try {
      const user = await AuthService.register(email, password, username, role);
      const token = AuthService.generateToken(user.id, user.email);

      return BaseController.success(
        res,
        { user, token },
        'User registered successfully',
        201
      );
    } catch (error) {
      if (error.message === 'User with this email already exists' || error.message.includes('Role must be')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return BaseController.badRequest(res, 'Email and password are required');
    }

    try {
      const result = await AuthService.login(email, password);
      return BaseController.success(res, result, 'Login successful');
    } catch (error) {
      if (error.message === 'Invalid email or password' || error.message === 'Account is inactive') {
        return BaseController.unauthorized(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }

  static async logout(req, res) {
    const result = AuthService.logout();
    return BaseController.success(res, result, result.message);
  }

  static async updateProfile(req, res) {
    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    const { walletAddress, username, bio, avatarUrl } = req.body;

    try {
      const user = await AuthService.updateProfile(req.user.id, {
        walletAddress,
        username,
        bio,
        avatarUrl
      });
      return BaseController.success(res, user, 'Profile updated successfully');
    } catch (error) {
      if (error.message === 'User not found') {
        return BaseController.notFound(res, error.message);
      }
      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }
}
