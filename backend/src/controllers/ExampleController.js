import { BaseController } from './BaseController.js';

export class ExampleController extends BaseController {
  static async getPublicData(req, res) {
    return BaseController.success(res, { message: 'This is public data' });
  }

  static async getProtectedData(req, res) {
    const user = req.user;
    return BaseController.success(res, {
      message: 'This is protected data',
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  }
}
