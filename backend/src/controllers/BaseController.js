import { AuthService } from '../services/AuthService.js';

export class BaseController {
  static handleAsync(handler) {
    return async (req, res, next) => {
      try {
        await handler(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }

  static requireAuth() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return BaseController.unauthorized(res, 'Authentication required. Please provide a valid token.');
        }

        const token = authHeader.substring(7);

        try {
          const user = await AuthService.verifyToken(token);
          req.user = user;
          next();
        } catch (error) {
          if (error.message === 'Invalid token' || error.message === 'Token expired') {
            return BaseController.unauthorized(res, error.message);
          }
          if (error.message === 'Account is inactive') {
            return BaseController.forbidden(res, error.message);
          }
          throw error;
        }
      } catch (error) {
        next(error);
      }
    };
  }

  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, error, message = 'An error occurred', statusCode = 500) {
    const errorMessage = error?.message || message;
    const errorDetails = process.env.NODE_ENV === 'development' ? error?.stack : undefined;

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      ...(errorDetails && { details: errorDetails })
    });
  }

  static notFound(res, message = 'Resource not found') {
    return res.status(404).json({
      success: false,
      error: 'Not found',
      message
    });
  }

  static badRequest(res, message = 'Bad request') {
    return res.status(400).json({
      success: false,
      error: 'Bad request',
      message
    });
  }

  static unauthorized(res, message = 'Unauthorized') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message
    });
  }

  static forbidden(res, message = 'Forbidden') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message
    });
  }

  static hasRole(user, role) {
    if (!user) {
      return false;
    }
    return user.role === role;
  }

  static isCourier(user) {
    return this.hasRole(user, 'courier');
  }

  static requireRole(role) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return BaseController.unauthorized(res, 'Authentication required');
        }

        if (!this.hasRole(req.user, role)) {
          return BaseController.forbidden(res, `This endpoint requires ${role} role`);
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
