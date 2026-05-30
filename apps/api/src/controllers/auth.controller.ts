import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';
import { loginSchema, registerSchema } from '@bezon/validation';
import type { UserRole } from '@bezon/types';

const JWT_SECRET = process.env.JWT_SECRET || 'bezon-jwt-secret-key';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'bezon-cookie-secret';

/**
 * Handle user registration (Customers, Sellers, Delivery partners)
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate request schema via @bezon/validation
    const validationResult = registerSchema.safeParse({ name, email, phone, password });
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
    }

    // Determine target registration role
    const VALID_ROLES = ['customer', 'seller', 'delivery', 'admin'];
    const userRole = VALID_ROLES.includes(role) ? (role as UserRole) : 'customer';

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user account with this email address already exists.',
      });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and profile structure in Postgres database transaction
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

    res.status(201).json({
      success: true,
      message: 'Registration successful. Account created.',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle user credential sign-in and cookie assignment
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validate request schema via @bezon/validation
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
    }

    // Load user record from database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.',
      });
    }

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email and password.',
      });
    }

    // Create 1-day JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: 'Sign-in successful.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle user sign-out and cookie clearance
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Return current session details for caller
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No active session verified.',
      });
    }

    res.json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};
