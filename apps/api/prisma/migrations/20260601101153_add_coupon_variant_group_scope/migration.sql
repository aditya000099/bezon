-- AlterEnum
ALTER TYPE "CouponScope" ADD VALUE 'variantGroup';

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN     "scope_variant_group_id" UUID;
