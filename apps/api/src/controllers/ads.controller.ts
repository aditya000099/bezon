import { Request, Response, NextFunction } from 'express';
import { AdsService } from '../services/ads.service.js';

export const createCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.seller?.id;
    if (!sellerId) return res.status(403).json({ success: false, message: 'Seller access required.' });
    const campaign = await AdsService.createCampaign(sellerId, req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (err: any) {
    if (err.message) return res.status(400).json({ success: false, message: err.message });
    next(err);
  }
};

export const getMyCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.seller?.id;
    if (!sellerId) return res.status(403).json({ success: false, message: 'Seller access required.' });
    const campaigns = await AdsService.getSellerCampaigns(sellerId);
    res.json({ success: true, data: campaigns });
  } catch (err) {
    next(err);
  }
};

export const updateCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.seller?.id;
    if (!sellerId) return res.status(403).json({ success: false, message: 'Seller access required.' });
    const campaign = await AdsService.updateCampaign(sellerId, req.params.id, req.body);
    res.json({ success: true, data: campaign });
  } catch (err: any) {
    if (err.message) return res.status(400).json({ success: false, message: err.message });
    next(err);
  }
};

export const deleteCampaign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.seller?.id;
    if (!sellerId) return res.status(403).json({ success: false, message: 'Seller access required.' });
    await AdsService.deleteCampaign(sellerId, req.params.id);
    res.json({ success: true, message: 'Campaign deleted.' });
  } catch (err: any) {
    if (err.message) return res.status(400).json({ success: false, message: err.message });
    next(err);
  }
};

export const getCampaignStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.seller?.id;
    if (!sellerId) return res.status(403).json({ success: false, message: 'Seller access required.' });
    const stats = await AdsService.getCampaignStats(sellerId, req.params.id);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    if (err.message) return res.status(400).json({ success: false, message: err.message });
    next(err);
  }
};

// Public: get sponsored products for shop page
export const getSponsoredProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, limit, excludeProductIds } = req.body;
    const products = await AdsService.getSponsoredProducts({
      categoryId,
      limit: limit ? Number(limit) : undefined,
      excludeProductIds,
    });
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// Public: record ad click
export const recordAdClick = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdsService.recordClick(req.params.campaignId, req.user?.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// Admin: all campaigns
export const getAdminCampaigns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status } = req.query;
    const result = await AdsService.getAllCampaigns({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status: status as string | undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
