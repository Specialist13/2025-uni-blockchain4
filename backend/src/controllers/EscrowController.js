import { BaseController } from './BaseController.js';
import { EscrowService } from '../services/EscrowService.js';

export class EscrowController extends BaseController {
  static async getEscrow(req, res) {
    const { id } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Escrow ID is required');
    }

    try {
      const escrow = await EscrowService.getEscrow(parseInt(id, 10));
      const userAddress = req.user.walletAddress.toLowerCase();

      if (escrow.buyer.toLowerCase() !== userAddress && escrow.seller.toLowerCase() !== userAddress) {
        return BaseController.forbidden(res, 'You can only view escrows for your own orders');
      }

      return BaseController.success(res, escrow, 'Escrow retrieved successfully');
    } catch (error) {
      if (error.message === 'Escrow not found') {
        return BaseController.notFound(res, error.message);
      }
      return BaseController.error(res, error, error.message, 500);
    }
  }
}
