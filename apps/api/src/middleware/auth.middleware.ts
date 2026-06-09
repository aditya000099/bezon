import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';
import { config } from '../config/env.config.js';
import type { UserRole } from '@bezon/types';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        avatarUrl: string | null;
        isActive: boolean;
        seller?: {
          id: string;
          status: string;
          rejectionReason: string | null;
        } | null;
        deliveryPartner?: {
          status: string;
          rejectionReason: string | null;
        } | null;
      };
    }
  }
}

const JWT_SECRET = config.JWT_SECRET;

/**
 * Middleware to authenticate user via JWT in httpOnly cookie
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing. Please sign in.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization payload.',
      });
    }

    // Validate UUID to prevent Prisma P2007 error on stale sessions
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(decoded.userId)) {
      res.clearCookie('token');
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization payload.',
      });
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        seller: {
          select: { id: true, status: true, rejectionReason: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is deactivated.',
      });
    }

    let deliveryPartner = null;
    try {
      deliveryPartner = await prisma.deliveryPartner.findUnique({
        where: { userId: decoded.userId },
        select: { status: true, rejectionReason: true },
      });
    } catch (e: any) {
      // Gracefully handle unmigrated database columns
      console.warn(`authenticateUser DeliveryPartner query failed (likely pending DB migration): ${e.message}`);
    }

    // Attach to request
    req.user = { ...user, deliveryPartner } as any;
    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token. Please sign in again.',
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please sign in again.',
      });
    }

    // If Prisma throws a validation or known request error (like invalid UUID format or missing relation), treat it as an invalid token
    if (err.name === 'PrismaClientValidationError' || err.name === 'PrismaClientKnownRequestError') {
      res.clearCookie('token');
      return res.status(401).json({
        success: false,
        message: 'Invalid database constraint or session data. Please sign in again.',
      });
    }

    next(err);
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token;
    if (!token) return next();
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    if (!decoded.userId) return next();
    
    // Validate UUID to prevent Prisma P2007 error
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(decoded.userId)) return next();

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, isActive: true },
    });
    if (user && user.isActive) req.user = user as any;
    next();
  } catch {
    next();
  }
};

/**
 * Middleware to restrict route access to specific roles
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Authenticated session required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient platform permissions.',
      });
    }

    next();
  };
};

/**
 * Middleware to require an approved seller profile
 */
export const requireSeller = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authenticated session required.',
    });
  }

  // Check if they are a seller with an approved status
  if (req.user.role !== 'seller' || req.user.seller?.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Active seller role required.',
    });
  }

  next();
};

/**
 * Middleware to require an approved seller profile or admin role
 */
export const requireSellerOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authenticated session required.',
    });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'seller' && req.user.seller?.status === 'approved') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. Active seller profile or admin role required.',
  });
};

/**
 * Middleware to require an approved delivery partner profile
 */
export const requireDeliveryPartner = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authenticated session required.',
    });
  }

  // Verify delivery partner profile exists, is approved, and role is correctly set
  if (req.user.role !== 'delivery' || req.user.deliveryPartner?.status !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Active delivery partner role required.',
    });
  }

  next();
};

/**
 * Middleware to require a customer role
 */
export const requireCustomer = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Authenticated session required.',
    });
  }

  if (req.user.role !== 'customer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Customer role required.',
    });
  }

  next();
};

