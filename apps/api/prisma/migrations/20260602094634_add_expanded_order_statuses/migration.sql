-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'return_rejected';
ALTER TYPE "OrderStatus" ADD VALUE 'refund_requested';
ALTER TYPE "OrderStatus" ADD VALUE 'refund_approved';
ALTER TYPE "OrderStatus" ADD VALUE 'refund_rejected';
ALTER TYPE "OrderStatus" ADD VALUE 'replacement_requested';
ALTER TYPE "OrderStatus" ADD VALUE 'replacement_approved';
ALTER TYPE "OrderStatus" ADD VALUE 'replacement_shipped';
ALTER TYPE "OrderStatus" ADD VALUE 'replaced';
ALTER TYPE "OrderStatus" ADD VALUE 'replacement_rejected';
