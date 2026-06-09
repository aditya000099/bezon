import prisma from '../db/client.js';

export class CategoryService {
  /**
   * Retrieves all active categories
   */
  static async getAllCategories() {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Creates a new product category
   */
  static async createCategory(data: {
    name: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }) {
    const { name, description, parentId, sortOrder } = data;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check slug uniqueness
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      const err = new Error('A category with this name or slug already exists.');
      (err as any).status = 409;
      throw err;
    }

    return await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        parentId: parentId || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isActive: true,
      },
    });
  }
  /**
   * Retrieves all categories for admin (including inactive ones) with product counts
   */
  static async getAdminCategories() {
    return await prisma.category.findMany({
      include: {
        parent: { select: { name: true } },
        _count: {
          select: { products: true }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
    });
  }

  /**
   * Retrieves a single category by ID
   */
  static async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
      }
    });

    if (!category) {
      const err = new Error('Category not found.');
      (err as any).status = 404;
      throw err;
    }

    return category;
  }

  /**
   * Updates an existing category
   */
  static async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    parentId?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const category = await this.getCategoryById(id);
    const updateData: any = { ...data };

    if (data.name && data.name !== category.name) {
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existingCategory = await prisma.category.findUnique({
        where: { slug },
      });

      if (existingCategory && existingCategory.id !== id) {
        const err = new Error('A category with this name or slug already exists.');
        (err as any).status = 409;
        throw err;
      }
      updateData.name = data.name;
      updateData.slug = slug;
    }

    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        const err = new Error('A category cannot be its own parent.');
        (err as any).status = 400;
        throw err;
      }
      updateData.parentId = data.parentId;
    }

    return await prisma.category.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Deletes a category if it has no products
   */
  static async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } }
      }
    });

    if (!category) {
      const err = new Error('Category not found.');
      (err as any).status = 404;
      throw err;
    }

    if (category._count.products > 0) {
      const err = new Error('Cannot delete category because it has products assigned. Please deactivate it instead.');
      (err as any).status = 400;
      throw err;
    }

    return await prisma.category.delete({
      where: { id },
    });
  }
}
