import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';

/**
 * Retrieve order history list depending on caller role
 */
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const orders = await OrderService.getOrders({
      id: req.user.id,
      role: req.user.role,
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve detailed progress tracking for a specific order
 */
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await OrderService.getOrderById(id, {
      id: req.user.id,
      role: req.user.role,
    });

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update the status of a specific order
 */
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const order = await OrderService.updateOrderStatus(id, status, {
      id: req.user.id,
      role: req.user.role,
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Request a policy action (return, refund, replace) on a delivered order item
 */
export const requestOrderPolicyAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { actionType, itemId, reason } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (!actionType || !itemId) {
      return res.status(400).json({ success: false, message: 'actionType and itemId are required.' });
    }

    const order = await OrderService.requestOrderPolicyAction(id, actionType, itemId, reason, {
      id: req.user.id,
      role: req.user.role,
    });

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve seller order history
 */
export const getSellerOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const orders = await OrderService.getSellerOrders(req.user.id);

    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve specific order details for a seller
 */
export const getSellerOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await OrderService.getSellerOrderById(id, req.user.id);

    res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

