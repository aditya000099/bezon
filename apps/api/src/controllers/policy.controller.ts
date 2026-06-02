import { Request, Response, NextFunction } from 'express';
import { PolicyService } from '../services/policy.service.js';

export const getAllPolicies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activeOnly = req.query.active === 'true';
    const policies = await PolicyService.getAll(activeOnly);
    res.json({ success: true, data: policies });
  } catch (err) {
    next(err);
  }
};

export const createPolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await PolicyService.create(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
};

export const updatePolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await PolicyService.update(req.params.id as string, req.body);
    res.json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
};

export const togglePolicyActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const policy = await PolicyService.toggleActive(req.params.id as string);
    res.json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
};

export const deletePolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await PolicyService.deletePolicy(req.params.id as string);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};
