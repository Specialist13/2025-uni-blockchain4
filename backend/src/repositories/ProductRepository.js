import { getRepository } from '../database/connection.js';
import { Product } from '../entities/Product.js';

export class ProductRepository {
  static getRepository() {
    return getRepository(Product);
  }

  static async findById(id) {
    const repository = this.getRepository();
    return await repository.findOne({ where: { id } });
  }

  static async findBySeller(sellerAddress) {
    const repository = this.getRepository();
    return await repository.find({ where: { seller: sellerAddress } });
  }

  static async findAllActive() {
    const repository = this.getRepository();
    return await repository.find({ where: { isActive: true } });
  }

  static async create(productData) {
    const repository = this.getRepository();
    const product = repository.create(productData);
    return await repository.save(product);
  }

  static async update(id, productData) {
    const repository = this.getRepository();
    await repository.update(id, productData);
    return await this.findById(id);
  }

  static async syncFromBlockchain(blockchainProduct) {
    const repository = this.getRepository();
    const existing = await this.findById(Number(blockchainProduct.id));
    
    if (existing) {
      return await this.update(existing.id, {
        seller: blockchainProduct.seller,
        title: blockchainProduct.title,
        description: blockchainProduct.description,
        priceWei: blockchainProduct.priceWei.toString(),
        isActive: blockchainProduct.isActive,
        createdAt: new Date(Number(blockchainProduct.createdAt) * 1000)
      });
    } else {
      return await this.create({
        id: Number(blockchainProduct.id),
        seller: blockchainProduct.seller,
        title: blockchainProduct.title,
        description: blockchainProduct.description,
        priceWei: blockchainProduct.priceWei.toString(),
        isActive: blockchainProduct.isActive,
        createdAt: new Date(Number(blockchainProduct.createdAt) * 1000)
      });
    }
  }
}
