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
}
