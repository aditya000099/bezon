import { Request, Response, NextFunction } from 'express';
import { addressSchema } from '@bezon/validation';
import { AddressService } from '../services/address.service.js';

/**
 * Get all saved addresses of the logged-in user
 */
export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No active session verified.',
      });
    }

    const addresses = await AddressService.getUserAddresses(req.user.id);

    res.json({
      success: true,
      data: addresses,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Save a new address for the logged-in user
 */
export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No active session verified.',
      });
    }

    // Validate request schema via @bezon/validation
    const validationResult = addressSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
    }

    const newAddress = await AddressService.createAddress(req.user.id, {
      ...validationResult.data,
      isDefault: req.body.isDefault,
    });

    res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      data: newAddress,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing address
 */
export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No active session verified.',
      });
    }

    const id = req.params.id as string;

    // Validate a partial set of fields
    const partialSchema = addressSchema.partial();
    const validationResult = partialSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.error.issues[0].message,
      });
    }

    const updated = await AddressService.updateAddress(req.user.id, id, {
      ...validationResult.data,
      isDefault: req.body.isDefault,
    });

    res.json({
      success: true,
      message: 'Address updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a saved address
 */
export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No active session verified.',
      });
    }

    const id = req.params.id as string;

    await AddressService.deleteAddress(req.user.id, id);

    res.json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
