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

  static async register(email, password, username = null, role = null) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (role !== null && role !== 'courier') {
      throw new Error('Role must be null (regular user) or "courier"');
    }

    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserRepository.create({
      email,
      password: hashedPassword,
      username,
      role
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

  static async updateProfile(userId, profileData) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updateData = {};

    if (profileData.walletAddress !== undefined) {
      const walletAddress = profileData.walletAddress.trim();
      if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        throw new Error('Invalid wallet address format');
      }
      updateData.walletAddress = walletAddress || null;
    }

    if (profileData.username !== undefined) {
      if (profileData.username && profileData.username.length > 255) {
        throw new Error('Username must be 255 characters or less');
      }
      updateData.username = profileData.username || null;
    }

    if (profileData.bio !== undefined) {
      updateData.bio = profileData.bio || null;
    }

    if (profileData.avatarUrl !== undefined) {
      if (profileData.avatarUrl && profileData.avatarUrl.length > 500) {
        throw new Error('Avatar URL must be 500 characters or less');
      }
      updateData.avatarUrl = profileData.avatarUrl || null;
    }

    const updatedUser = await UserRepository.update(userId, updateData);
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}
