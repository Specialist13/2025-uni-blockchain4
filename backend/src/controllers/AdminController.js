import { BaseController } from './BaseController.js';
import { CourierContractService } from '../services/contracts/CourierContractService.js';

export class AdminController extends BaseController {
  static async addCourier(req, res) {
    const { courierAddress } = req.body;

    if (!courierAddress) {
      return BaseController.badRequest(res, 'courierAddress is required');
    }

    try {
      const result = await CourierContractService.addCourier(courierAddress);
      
      return BaseController.success(res, {
        transactionHash: result.hash,
        courierAddress
      }, 'Courier added successfully');
    } catch (error) {
      return BaseController.error(res, error, 'Failed to add courier');
    }
  }
}
