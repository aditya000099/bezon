import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';

/**
 * Get all users with their recommendation profiles for admin view
 */
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await UserService.getAdminUsersList();
    
    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};
