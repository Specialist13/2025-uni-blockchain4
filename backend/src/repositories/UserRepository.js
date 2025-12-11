import { getRepository } from '../database/connection.js';
import { User } from '../entities/User.js';

export class UserRepository {
  static getRepository() {
    return getRepository(User);
  }

  static async findByEmail(email) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { email: email.toLowerCase() }
    });
  }

  static async findById(id) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { id }
    });
  }

  static async create(userData) {
    const repository = this.getRepository();
    const user = repository.create({
      ...userData,
      email: userData.email?.toLowerCase()
    });
    return await repository.save(user);
  }

  static async update(id, userData) {
    const repository = this.getRepository();
    await repository.update(id, {
      ...userData,
      ...(userData.email && { email: userData.email.toLowerCase() })
    });
    return await this.findById(id);
  }
}
