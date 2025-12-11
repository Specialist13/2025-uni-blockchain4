import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/UserRepository.js';

export class AuthService {
  static getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    return secret;
  }

  static getJwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || '7d';
  }

  static async register(email, password, username = null) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      email,
      password: hashedPassword,
      username
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async login(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email);

    const { password: _, ...userWithoutPassword } = user;
    return {
      token,
      user: userWithoutPassword
    };
  }

  static logout() {
    return { success: true, message: 'Logged out successfully' };
  }

  static generateToken(userId, email) {
    const secret = this.getJwtSecret();
    const expiresIn = this.getJwtExpiresIn();

    return jwt.sign(
      { userId, email },
      secret,
      { expiresIn }
    );
  }

  static async verifyToken(token) {
    if (!token) {
      throw new Error('Token is required');
    }

    const secret = this.getJwtSecret();
    
    try {
      const decoded = jwt.verify(token, secret);
      const user = await UserRepository.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('Account is inactive');
      }

      return user;
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      throw error;
    }
  }
}
