import { BaseController } from './BaseController.js';
import { ProductService } from '../services/ProductService.js';
import { WeiConverter } from '../utils/weiConverter.js';

export class ProductController extends BaseController {
  static async listProducts(req, res) {
    const {
      page,
      limit,
      seller,
      isActive,
      minPrice,
      maxPrice,
      search
    } = req.query;

    const options = {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      seller,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      minPrice: minPrice ? WeiConverter.etherToWei(minPrice) : undefined,
      maxPrice: maxPrice ? WeiConverter.etherToWei(maxPrice) : undefined,
      search
    };

    try {
      const result = await ProductService.listProducts(options);
      
      if (result.products) {
        result.products = result.products.map(product => {
          const { priceWei, ...rest } = product;
          return {
            ...rest,
            price: WeiConverter.weiToEther(priceWei)
          };
        });
      }
      
      return BaseController.success(res, result, 'Products retrieved successfully');
    } catch (error) {
      return BaseController.error(res, error, error.message, 500);
    }
  }

  static async getProduct(req, res) {
    const { id } = req.params;

    if (!id) {
      return BaseController.badRequest(res, 'Product ID is required');
    }

    try {
      const product = await ProductService.getProduct(parseInt(id, 10));
      const { priceWei, ...rest } = product;
      const productResponse = {
        ...rest,
        price: WeiConverter.weiToEther(priceWei)
      };
      return BaseController.success(res, productResponse, 'Product retrieved successfully');
    } catch (error) {
      if (error.message === 'Product not found') {
        return BaseController.notFound(res, error.message);
      }
      return BaseController.error(res, error, error.message, 500);
    }
  }

  static async createProduct(req, res) {
    const { title, description, price, priceWei, imageUrl, imageUrls } = req.body;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    try {
      const priceWeiValue = price ? WeiConverter.etherToWei(price) : priceWei;
      const product = await ProductService.createProduct(
        { title, description, priceWei: priceWeiValue, imageUrl, imageUrls },
        req.user.walletAddress
      );
      const { priceWei: productPriceWei, ...rest } = product;
      const productResponse = {
        ...rest,
        price: WeiConverter.weiToEther(productPriceWei)
      };
      return BaseController.success(
        res,
        productResponse,
        'Product created successfully',
        201
      );
    } catch (error) {
      if (error.message.includes('required') || error.message.includes('must be')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }

  static async updateProduct(req, res) {
    const { id } = req.params;
    const { title, description, price, priceWei, imageUrl, imageUrls } = req.body;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Product ID is required');
    }

    try {
      const priceWeiValue = price !== undefined ? WeiConverter.etherToWei(price) : priceWei;
      const product = await ProductService.updateProduct(
        parseInt(id, 10),
        { title, description, priceWei: priceWeiValue, imageUrl, imageUrls },
        req.user.walletAddress
      );
      const { priceWei: productPriceWei, ...rest } = product;
      const productResponse = {
        ...rest,
        price: WeiConverter.weiToEther(productPriceWei)
      };
      return BaseController.success(res, productResponse, 'Product updated successfully');
    } catch (error) {
      if (error.message === 'Product not found') {
        return BaseController.notFound(res, error.message);
      }
      if (error.message === 'Only the seller can update this product') {
        return BaseController.forbidden(res, error.message);
      }
      if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('cannot be empty')) {
        return BaseController.badRequest(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }

  static async deactivateProduct(req, res) {
    const { id } = req.params;

    if (!req.user) {
      return BaseController.unauthorized(res, 'Authentication required');
    }

    if (!req.user.walletAddress) {
      return BaseController.badRequest(res, 'Wallet address must be set for user account');
    }

    if (!id) {
      return BaseController.badRequest(res, 'Product ID is required');
    }

    try {
      const product = await ProductService.deactivateProduct(
        parseInt(id, 10),
        req.user.walletAddress
      );
      const { priceWei, ...rest } = product;
      const productResponse = {
        ...rest,
        price: WeiConverter.weiToEther(priceWei)
      };
      return BaseController.success(res, productResponse, 'Product deactivated successfully');
    } catch (error) {
      if (error.message === 'Product not found') {
        return BaseController.notFound(res, error.message);
      }
      if (error.message === 'Only the seller can deactivate this product') {
        return BaseController.forbidden(res, error.message);
      }
      return BaseController.error(res, error, error.message, 400);
    }
  }
}
