import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.js';

/**
 * Pre-create split orders and initiate Razorpay checkout order
 */
export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { addressId, address: addressPayload } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const result = await PaymentService.createPaymentOrder(req.user.id, {
      addressId,
      addressPayload,
    });

    res.status(201).json({
      success: true,
      message: 'Orders pre-created successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify Razorpay payment signature & update database status
 */
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    await PaymentService.verifyPayment(req.user.id, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    res.json({
      success: true,
      message: 'Payment verification successful. Shipments generated.',
    });
  } catch (err) {
    next(err);
  }
};
