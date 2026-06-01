import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s\-(). ]{7,20}$/, 'Invalid phone number format').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const addressSchema = z.object({
  label: z.string().min(2, 'Label must be at least 2 characters long').default('Home'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
  phone: z.string().min(7, 'Phone number must be at least 7 digits'),
  line1: z.string().min(5, 'Address line 1 must be at least 5 characters long'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City must be at least 2 characters long'),
  state: z.string().min(2, 'State must be at least 2 characters long'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  country: z.string().min(2, 'Country must be at least 2 characters long').default('India'),
});

export const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  brand: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().positive('Base price must be greater than zero'),
  comparePrice: z.number().positive('Compare price must be positive').optional(),
  totalStock: z.number().int().nonnegative('Total stock cannot be negative').default(0),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const productVariantSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters long'),
  price: z.number().positive('Variant price must be greater than zero'),
  stock: z.number().int().nonnegative('Variant stock cannot be negative').default(0),
  lowStockAlert: z.number().int().nonnegative().default(5),
  weightGrams: z.number().int().positive().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
});

export const couponSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase letters, numbers, hyphens, or underscores'),
  description: z.string().min(5).max(200),
  discountType: z.enum(['percentage', 'flat']),
  discountValue: z.number().positive('Discount value must be greater than zero'),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().nonnegative().default(0),
  maxUses: z.number().int().positive().optional(),
  maxUsesPerUser: z.number().int().positive().default(1),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  scopeType: z.enum(['all', 'category', 'product']).default('all'),
  scopeCategoryId: z.string().uuid().optional(),
  scopeProductId: z.string().uuid().optional(),
}).refine(
  (data) => new Date(data.validUntil) > new Date(data.validFrom),
  { message: 'validUntil must be after validFrom', path: ['validUntil'] },
).refine(
  (data) => data.discountType !== 'percentage' || data.discountValue <= 100,
  { message: 'Percentage discount cannot exceed 100%', path: ['discountValue'] },
).refine(
  (data) => data.scopeType !== 'category' || !!data.scopeCategoryId,
  { message: 'Category ID is required when scope is category', path: ['scopeCategoryId'] },
).refine(
  (data) => data.scopeType !== 'product' || !!data.scopeProductId,
  { message: 'Product ID is required when scope is product', path: ['scopeProductId'] },
);
