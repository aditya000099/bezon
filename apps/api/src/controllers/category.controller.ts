import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service.js';

/**
 * Get all active categories in hierarchy sorted
 */
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await CategoryService.getAllCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new product category (Admin only)
 */
export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, description, parentId, sortOrder } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const newCategory = await CategoryService.createCategory({
      name,
      description,
      parentId,
      sortOrder: sortOrder ? Number(sortOrder) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: newCategory,
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await CategoryService.getAdminCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category = await CategoryService.getCategoryById(
      req.params.id as string,
    );
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { name, description, parentId, sortOrder, isActive } = req.body;

    const updated = await CategoryService.updateCategory(id as string, {
      name,
      description,
      parentId,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    });

    res.json({
      success: true,
      message: 'Category updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    await CategoryService.deleteCategory(id as string);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
