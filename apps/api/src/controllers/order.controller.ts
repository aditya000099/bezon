import { Request, Response, NextFunction } from 'express';
import { CustomerOrderService } from '../services/order/customer.order.service.js';
import { SellerOrderService } from '../services/order/seller.order.service.js';
import { AdminOrderService } from '../services/order/admin.order.service.js';

/**
 * Retrieve order history list depending on caller role
 */
export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const filters = req.query;
    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    
    let result;

    if (req.user.role === 'customer') {
      result = await CustomerOrderService.getOrders(req.user.id, page, limit);
    } else if (req.user.role === 'seller') {
      result = await SellerOrderService.getOrders(req.user.id, filters, page, limit);
    } else if (req.user.role === 'admin') {
      result = await AdminOrderService.getOrders(filters, page, limit);
    } else {
      return res.status(403).json({ success: false, message: 'Role not supported for order history.' });
    }

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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

    let order;
    if (req.user.role === 'customer') {
      order = await CustomerOrderService.getOrderById(id, req.user.id);
    } else if (req.user.role === 'seller') {
      order = await SellerOrderService.getOrderById(id, req.user.id);
    } else if (req.user.role === 'admin') {
      order = await AdminOrderService.getOrderById(id);
    } else {
      return res.status(403).json({ success: false, message: 'Role not supported for order details.' });
    }

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

    let order;
    if (req.user.role === 'seller') {
      order = await SellerOrderService.updateOrderStatus(id, status, req.user.id);
    } else if (req.user.role === 'admin') {
      order = await AdminOrderService.updateOrderStatus(id, status, req.user.id);
    } else {
      return res.status(403).json({ success: false, message: 'Only sellers and admins can update order status.' });
    }

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

    if (!req.user || req.user.role !== 'customer') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (!actionType || !itemId) {
      return res.status(400).json({ success: false, message: 'actionType and itemId are required.' });
    }

    const order = await CustomerOrderService.requestPolicyAction(id, actionType, itemId, reason, req.user.id);

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
    if (!req.user || req.user.role !== 'seller') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const { returnStatus, returnInspectionStatus } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await SellerOrderService.getOrders(
      req.user.id, 
      {
        returnStatus: returnStatus as string,
        returnInspectionStatus: returnInspectionStatus as string,
      },
      page,
      limit
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'seller') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await SellerOrderService.getOrderById(id, req.user.id);

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

    const order = await CustomerOrderService.cancelOrder(id, req.user.id, cancelReason);

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

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'seller') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await SellerOrderService.cancelOrder(id, req.user.id, cancelReason);

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

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    const order = await AdminOrderService.markRefundCompleted(id, req.user.id);

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
 * Request a return (Legacy fallback handled in CustomerOrderService now but keeping for compatibility if frontend uses it)
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

    // Notice: The newer requestPolicyAction API replaced this in V2, but this keeps backwards compat.
    // We map it to requestPolicyAction on the first item in the order as a fallback.
    const orderDetails = await CustomerOrderService.getOrderById(id, req.user.id);
    if (!orderDetails.items[0]) {
       return res.status(400).json({ success: false, message: 'No items found in order.' });
    }

    const order = await CustomerOrderService.requestPolicyAction(id, 'return', orderDetails.items[0].id, reason, req.user.id);

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
 * Approve a return
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

    const order = await SellerOrderService.approveReturn(id, req.user.id);

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
 * Reject a return
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

    const order = await SellerOrderService.rejectReturn(id, req.user.id, rejectionReason);

    res.json({
      success: true,
      message: 'Return rejected successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Inspect a completed return
 */
export const inspectReturn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, notes } = req.body;

    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || id === 'undefined' || !uuidRegex.test(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order ID format.' });
    }

    if (!req.user || req.user.role !== 'seller') {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    if (!status || !['RESTOCKED', 'DAMAGED', 'DISPOSED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid inspection status.' });
    }

    const order = await SellerOrderService.inspectReturnedProduct(id, req.user.id, status, notes);

    res.json({
      success: true,
      message: 'Return inspected successfully.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Simulate Refund Processing
 */
export const simulateRefundProcessing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    
    if (!req.user || req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized session. Admin only.' });
    }

    const order = await AdminOrderService.simulateRefundProcessing(id, req.user.id);
    
    res.json({
      success: true,
      message: 'Refund processing started.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Simulate Refund Completed
 */
export const simulateRefundCompleted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    
    if (!req.user || req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized session. Admin only.' });
    }

    const order = await AdminOrderService.simulateRefundCompleted(id, req.user.id);
    
    res.json({
      success: true,
      message: 'Refund completed.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Simulate Refund Failed
 */
export const simulateRefundFailed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    
    if (!req.user || req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized session. Admin only.' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Failure reason is required.' });
    }

    const order = await AdminOrderService.simulateRefundFailed(id, req.user.id, reason);
    
    res.json({
      success: true,
      message: 'Refund marked as failed.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};
