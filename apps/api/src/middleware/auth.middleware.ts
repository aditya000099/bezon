import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/client.js';
import { UserRole } from '@bezon/types';

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
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'bezon-jwt-secret-key';

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

    // Attach to request
    req.user = user as any;
    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication session.',
      });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Please sign in again.',
      });
    }
    next(err);
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
