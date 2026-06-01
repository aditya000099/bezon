import { Request, Response, NextFunction } from 'express';
import { CouponService } from '../services/coupon.service.js';

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    const seller = await (await import('../db/client.js')).default.seller.findUnique({ where: { userId: req.user.id } });
    if (!seller) return res.status(403).json({ success: false, message: 'Seller profile not found.' });

    const coupon = await CouponService.create(seller.id, req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    const seller = await (await import('../db/client.js')).default.seller.findUnique({ where: { userId: req.user.id } });
    if (!seller) return res.status(403).json({ success: false, message: 'Seller profile not found.' });

    const coupon = await CouponService.update(seller.id, req.params.id as string, req.body);
    res.json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    const seller = await (await import('../db/client.js')).default.seller.findUnique({ where: { userId: req.user.id } });
    if (!seller) return res.status(403).json({ success: false, message: 'Seller profile not found.' });

    await CouponService.deleteCoupon(seller.id, req.params.id as string);
    res.json({ success: true, message: 'Coupon deactivated.' });
  } catch (err) {
    next(err);
  }
};

export const listSellerCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    const seller = await (await import('../db/client.js')).default.seller.findUnique({ where: { userId: req.user.id } });
    if (!seller) return res.status(403).json({ success: false, message: 'Seller profile not found.' });

    const coupons = await CouponService.listSellerCoupons(seller.id);
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
};

export const applyCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required.' });

    const result = await CouponService.applyCoupon(req.user.id, code);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getCartCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized.' });
    const coupons = await CouponService.getCartCoupons(req.user.id);
    res.json({ success: true, data: coupons });
  } catch (err) {
    next(err);
  }
};
