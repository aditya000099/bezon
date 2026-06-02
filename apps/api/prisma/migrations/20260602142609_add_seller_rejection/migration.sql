-- AlterEnum
ALTER TYPE "SellerStatus" ADD VALUE 'rejected';

-- AlterTable
ALTER TABLE "sellers" ADD COLUMN     "rejection_reason" TEXT;
