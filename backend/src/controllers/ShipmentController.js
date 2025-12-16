import { BaseController } from './BaseController.js';
import { ShipmentService } from '../services/ShipmentService.js';
import { OrderRepository } from '../repositories/OrderRepository.js';

export class ShipmentController extends BaseController {
  static async getShipment(req, res) {
    const { id } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Shipment ID is required');
    }

    try {
      const shipment = await ShipmentService.getShipment(parseInt(id, 10));
      const userAddress = req.user.walletAddress.toLowerCase();

      if (shipment.order) {
        const order = shipment.order;
        const isBuyer = order.buyer && order.buyer.toLowerCase() === userAddress;
        const isSeller = order.seller && order.seller.toLowerCase() === userAddress;
        const isCourier = shipment.courier && shipment.courier.toLowerCase() === userAddress;

        if (!isBuyer && !isSeller && !isCourier) {
          return BaseController.forbidden(res, 'You can only view shipments for your own orders or assigned courier jobs');
        }
      } else if (shipment.courier && shipment.courier.toLowerCase() !== userAddress) {
        return BaseController.forbidden(res, 'You can only view shipments assigned to you');
      }

      return BaseController.success(res, shipment, 'Shipment retrieved successfully');
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return BaseController.notFound(res, error.message);
      }
      return BaseController.error(res, error, error.message, 500);
    }
  }

  static async getShipmentByOrderId(req, res) {
    const { orderId } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!orderId) {
      return BaseController.badRequest(res, 'Order ID is required');
    }

    try {
      const shipment = await ShipmentService.getShipmentByOrderId(parseInt(orderId, 10));
      const userAddress = req.user.walletAddress.toLowerCase();

      if (shipment.order) {
        const order = shipment.order;
        const isBuyer = order.buyer && order.buyer.toLowerCase() === userAddress;
        const isSeller = order.seller && order.seller.toLowerCase() === userAddress;
        const isCourier = shipment.courier && shipment.courier.toLowerCase() === userAddress;

        if (!isBuyer && !isSeller && !isCourier) {
          return BaseController.forbidden(res, 'You can only view shipments for your own orders or assigned courier jobs');
        }
      } else if (shipment.courier && shipment.courier.toLowerCase() !== userAddress) {
        return BaseController.forbidden(res, 'You can only view shipments assigned to you');
      }

      return BaseController.success(res, shipment, 'Shipment retrieved successfully');
    } catch (error) {
      if (error.message === 'Shipment not found for this order') {
        return BaseController.notFound(res, error.message);
      }
      return BaseController.error(res, error, error.message, 500);
    }
  }

  static async confirmPickup(req, res) {
    const { id } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Shipment ID is required');
    }

    try {
      const result = await ShipmentService.confirmPickup(
        parseInt(id, 10),
        req.user.walletAddress
      );
      return BaseController.success(
        res,
        result,
        'Pickup confirmed successfully'
      );
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return BaseController.notFound(res, error.message);
      }
      if (error.message === 'Only the assigned courier can confirm pickup') {
        return BaseController.forbidden(res, error.message);
      }
      if (error.message.includes('cannot be picked up')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }

  static async confirmDelivery(req, res) {
    const { id } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Shipment ID is required');
    }

    try {
      const result = await ShipmentService.confirmDelivery(
        parseInt(id, 10),
        req.user.walletAddress
      );
      return BaseController.success(
        res,
        result,
        'Delivery confirmed successfully'
      );
    } catch (error) {
      if (error.message === 'Shipment not found') {
        return BaseController.notFound(res, error.message);
      }
      if (error.message === 'Only the assigned courier can confirm delivery') {
        return BaseController.forbidden(res, error.message);
      }
      if (error.message.includes('cannot be delivered')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }
}
