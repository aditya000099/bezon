import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';
import type { UserRole } from '@bezon/types';

const JWT_SECRET = process.env.JWT_SECRET || 'bezon-jwt-secret-key';

export class AuthService {
  /**
   * Registers a new user and configures associated profiles (seller/delivery)
   */
  static async registerUser(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: string;
  }) {
    const { name, email, phone, password, role } = data;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const err = new Error('A user account with this email address already exists.');
      (err as any).status = 409;
      throw err;
    }

    const VALID_ROLES = ['customer', 'seller', 'delivery', 'admin'];
    const userRole = VALID_ROLES.includes(role) ? (role as UserRole) : 'customer';

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role: userRole,
          isActive: true,
        },
      });

      // Automatically provision auxiliary profiles
      if (userRole === 'seller') {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
        await tx.seller.create({
          data: {
            userId: user.id,
            shopName: `${name}'s Shop`,
            shopSlug: slug,
            status: 'pending',
          },
        });
      } else if (userRole === 'delivery') {
        await tx.deliveryPartner.create({
          data: {
            userId: user.id,
            vehicleType: 'bike',
            isAvailable: true,
          },
        });
      }

      return user;
    });

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
  }

  /**
   * Log user in, verifying credentials and active status
   */
  static async loginUser(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const err = new Error('Invalid credentials. Please verify your email and password.');
      (err as any).status = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Your account has been deactivated.');
      (err as any).status = 403;
      throw err;
    }

    // Verify password
    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid credentials. Please verify your email and password.');
      (err as any).status = 401;
      throw err;
    }

    // Sign JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      },
      token,
    };
  }

  /**
   * Retrieves profile details for a logged-in user
   */
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user) {
      const err = new Error('User account not found.');
      (err as any).status = 404;
      throw err;
    }

    return user;
  }
}
