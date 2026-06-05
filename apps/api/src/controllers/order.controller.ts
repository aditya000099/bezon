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

    const filters = req.query;
    const orders = await OrderService.getOrders({
      id: req.user.id,
      role: req.user.role,
    }, filters);

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

    const { returnStatus } = req.query;
    const orders = await OrderService.getSellerOrders(req.user.id, {
      returnStatus: returnStatus as string,
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
 * Retrieve specific order details for a seller
 */
export const getSellerOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // Validate UUID to prevent Prisma Validation Errors
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

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


/**
 * Cancel a customer order
 */
export const cancelCustomerOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { cancelReason } = req.body;

    if (!req.user || req.user.role !== 'customer') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await OrderService.cancelCustomerOrder(id, req.user.id, cancelReason);

    res.json({
      success: true,
      message: 'Order cancelled successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Cancel an order by a seller
 */
export const cancelSellerOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { cancelReason } = req.body;

    // Validate UUID to prevent Prisma Validation Errors
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'seller') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await OrderService.cancelSellerOrder(id, req.user.id, cancelReason);

    res.json({
      success: true,
      message: 'Order cancelled successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a refund as completed (Admin only)
 */
export const markRefundCompleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    // Validate UUID to prevent Prisma Validation Errors
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await OrderService.markRefundCompleted(id, req.user.id);

    res.json({
      success: true,
      message: 'Refund marked as completed.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Phase 5 - Request a return
 */
export const requestReturn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { reason, notes } = req.body;

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'customer') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Return reason is required.' });
    }

    const order = await OrderService.requestReturn(id, req.user.id, reason, notes);

    res.json({
      success: true,
      message: 'Return requested successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Phase 5 - Approve a return
 */
export const approveReturn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'seller') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await OrderService.approveReturn(id, req.user.id);

    res.json({
      success: true,
      message: 'Return approved successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Phase 5 - Reject a return
 */
export const rejectReturn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { rejectionReason } = req.body;

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'seller') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const order = await OrderService.rejectReturn(id, req.user.id, rejectionReason);

    res.json({
      success: true,
      message: 'Return rejected successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
