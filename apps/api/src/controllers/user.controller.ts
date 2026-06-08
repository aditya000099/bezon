import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';

/**
 * Get all users with their recommendation profiles for admin view
 */
export const getAdminUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.query.role as string | undefined;
    const result = await UserService.getAdminUsersList(role);
    
    res.json({
      success: true,
      data: result.users,
      roleCounts: result.roleCounts
    });
  } catch (err) {
    next(err);
  }
};
