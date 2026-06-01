import { Request, Response, NextFunction } from 'express';
import { loginSchema, registerSchema } from '@bezon/validation';
import { AuthService } from '../services/auth.service.js';

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

    const newUser = await AuthService.registerUser({
      name,
      email,
      phone,
      password,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Account created.',
      data: newUser,
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

    const { user, token } = await AuthService.loginUser(email, password);

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
      data: user,
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

    const profile = await AuthService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update the current user's profile details
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Active session required.',
      });
    }

    const { name, phone, avatarUrl } = req.body;

    const updatedProfile = await AuthService.updateUserProfile(req.user.id, {
      name,
      phone,
      avatarUrl,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedProfile,
    });
  } catch (err) {
    next(err);
  }
};

