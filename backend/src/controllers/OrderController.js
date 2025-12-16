import { BaseController } from './BaseController.js';
import { OrderService } from '../services/OrderService.js';

export class OrderController extends BaseController {
  static async listOrders(req, res) {
    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    const {
      page,
      limit,
      status
    } = req.query;

    const userAddress = req.user.walletAddress;

    const options = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      userAddress,
      status
    };

    try {
      const result = await OrderService.listOrders(options);
      return BaseController.success(res, result, 'Orders retrieved successfully');
    } catch (error) {
      return BaseController.error(res, error, error.message, 500);
    }
  }

  static async getOrder(req, res) {
    const { id } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Order ID is required');
    }

    try {
      const order = await OrderService.getOrder(parseInt(id, 10));
      const userAddress = req.user.walletAddress.toLowerCase();

      if (order.buyer.toLowerCase() !== userAddress && order.seller.toLowerCase() !== userAddress) {
        return BaseController.forbidden(res, 'You can only view your own orders');
      }

      return BaseController.success(res, order, 'Order retrieved successfully');
    } catch (error) {
      if (error.message === 'Order not found') {
        return BaseController.notFound(res, error.message);
      }
      return BaseController.error(res, error, error.message, 500);
    }
  }

  static async createOrder(req, res) {
    const { productId } = req.body;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!productId) {
      return BaseController.badRequest(res, 'Product ID is required');
    }

    try {
      const order = await OrderService.createOrder(
        parseInt(productId, 10),
        req.user.walletAddress
      );
      return BaseController.success(
        res,
        order,
        'Order created successfully',
        201
      );
    } catch (error) {
      if (error.message === 'Product not found' || error.message === 'Product is not active') {
        return BaseController.badRequest(res, error.message);
      }
      if (error.message.includes('required') || error.message.includes('cannot')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }

  static async fundOrder(req, res) {
    const { id } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Order ID is required');
    }

    try {
      const result = await OrderService.fundOrder(
        parseInt(id, 10),
        req.user.walletAddress
      );
      return BaseController.success(
        res,
        result,
        'Order funded successfully'
      );
    } catch (error) {
      if (error.message === 'Order not found') {
        return BaseController.notFound(res, error.message);
      }
      if (error.message === 'Only the buyer can fund this order') {
        return BaseController.forbidden(res, error.message);
      }
      if (error.message.includes('cannot be funded')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }

  static async markReadyToShip(req, res) {
    const { id } = req.params;
    const { senderAddress, recipientAddress } = req.body;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Order ID is required');
    }

    if (!senderAddress) {
      return BaseController.badRequest(res, 'Sender address is required');
    }

    if (!recipientAddress) {
      return BaseController.badRequest(res, 'Recipient address is required');
    }

    try {
      const result = await OrderService.markReadyToShip(
        parseInt(id, 10),
        senderAddress,
        recipientAddress,
        req.user.walletAddress
      );
      return BaseController.success(
        res,
        result,
        'Order marked as ready to ship successfully'
      );
    } catch (error) {
      if (error.message === 'Order not found') {
        return BaseController.notFound(res, error.message);
      }
      if (error.message === 'Only the seller can mark this order as ready to ship') {
        return BaseController.forbidden(res, error.message);
      }
      if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('Missing required')) {
        return BaseController.badRequest(res, error.message);
      }
      if (error.message.includes('cannot be marked')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }

  static async confirmReceipt(req, res) {
    const { id } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Order ID is required');
    }

    try {
      const result = await OrderService.confirmReceipt(
        parseInt(id, 10),
        req.user.walletAddress
      );
      return BaseController.success(
        res,
        result,
        'Receipt confirmed successfully'
      );
    } catch (error) {
      if (error.message === 'Order not found') {
        return BaseController.notFound(res, error.message);
      }
      if (error.message === 'Only the buyer can confirm receipt') {
        return BaseController.forbidden(res, error.message);
      }
      if (error.message.includes('cannot be confirmed')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }
}
