import { ProductRepository } from '../repositories/ProductRepository.js';
import { MarketplaceContractService } from './contracts/MarketplaceContractService.js';

export class ProductService {
  static async createProduct(productData, sellerAddress) {
    const { title, description, priceWei, imageUrl, imageUrls } = productData;

    if (!title || !description || !priceWei) {
      throw new Error('Title, description, and priceWei are required');
    }

    if (!sellerAddress) {
      throw new Error('Seller address is required');
    }

    if (title.length > 255) {
      throw new Error('Title must be 255 characters or less');
    }

    if (description.length === 0) {
      throw new Error('Description cannot be empty');
    }

    const priceWeiStr = priceWei.toString();
    if (priceWeiStr === '0' || priceWeiStr === '') {
      throw new Error('Price must be greater than 0');
    }

    if (imageUrl && imageUrl.length > 1000) {
      throw new Error('Image URL must be 1000 characters or less');
    }

    if (imageUrls && !Array.isArray(imageUrls)) {
      throw new Error('imageUrls must be an array');
    }

    const txResult = await MarketplaceContractService.addProduct(
      title,
      description,
      priceWeiStr,
      sellerAddress
    );

    const product = await ProductRepository.create({
      seller: sellerAddress,
      title,
      description,
      priceWei: priceWeiStr,
      imageUrl: imageUrl || null,
      imageUrls: imageUrls || null,
      isActive: true
    });

    return product;
  }

  static async getProduct(id) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    const repository = ProductRepository.getRepository();
    const product = await repository.findOne({
      where: { id },
      relations: ['orders']
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  static async listProducts(options = {}) {
    const {
      page = 1,
      limit = 20,
      seller,
      isActive,
      minPrice,
      maxPrice,
      search
    } = options;

    const repository = ProductRepository.getRepository();
    const queryBuilder = repository.createQueryBuilder('product');

    if (seller) {
      queryBuilder.andWhere('product.seller = :seller', { seller });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    if (minPrice) {
      queryBuilder.andWhere('CAST(product.priceWei AS DECIMAL) >= :minPrice', {
        minPrice
      });
    }

    if (maxPrice) {
      queryBuilder.andWhere('CAST(product.priceWei AS DECIMAL) <= :maxPrice', {
        maxPrice
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.title LIKE :search OR product.description LIKE :search)',
        { search: `%${search}%` }
      );
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('product.createdAt', 'DESC');

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async updateProduct(id, productData, sellerAddress = null) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    const existingProduct = await ProductRepository.findById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    if (sellerAddress && existingProduct.seller !== sellerAddress) {
      throw new Error('Only the seller can update this product');
    }

    const updateData = {};

    if (productData.title !== undefined) {
      if (!productData.title || productData.title.length === 0) {
        throw new Error('Title cannot be empty');
      }
      if (productData.title.length > 255) {
        throw new Error('Title must be 255 characters or less');
      }
      updateData.title = productData.title;
    }

    if (productData.description !== undefined) {
      if (productData.description.length === 0) {
        throw new Error('Description cannot be empty');
      }
      updateData.description = productData.description;
    }

    if (productData.priceWei !== undefined) {
      const priceWeiStr = productData.priceWei.toString();
      if (priceWeiStr === '0' || priceWeiStr === '') {
        throw new Error('Price must be greater than 0');
      }
      updateData.priceWei = priceWeiStr;
    }

    if (productData.imageUrl !== undefined) {
      if (productData.imageUrl && productData.imageUrl.length > 500) {
        throw new Error('Image URL must be 500 characters or less');
      }
      updateData.imageUrl = productData.imageUrl || null;
    }

    if (productData.imageUrls !== undefined) {
      if (productData.imageUrls && !Array.isArray(productData.imageUrls)) {
        throw new Error('imageUrls must be an array');
      }
      updateData.imageUrls = productData.imageUrls || null;
    }

    return await ProductRepository.update(id, updateData);
  }

  static async deactivateProduct(id, sellerAddress = null) {
    if (!id) {
      throw new Error('Product ID is required');
    }

    const product = await ProductRepository.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    if (sellerAddress && product.seller !== sellerAddress) {
      throw new Error('Only the seller can deactivate this product');
    }

    return await ProductRepository.deactivate(id);
  }
}
