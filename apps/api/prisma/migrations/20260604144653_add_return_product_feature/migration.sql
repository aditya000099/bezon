-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('damaged', 'wrong_product', 'missing_items', 'not_as_described', 'defective', 'quality', 'other');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'return_rejected';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivered_at" TIMESTAMPTZ,
ADD COLUMN     "return_approved_at" TIMESTAMPTZ,
ADD COLUMN     "return_notes" TEXT,
ADD COLUMN     "return_reason" "ReturnReason",
ADD COLUMN     "return_rejected_at" TIMESTAMPTZ,
ADD COLUMN     "return_rejected_reason" TEXT,
ADD COLUMN     "return_requested_at" TIMESTAMPTZ,
ADD COLUMN     "return_status" "ReturnStatus" NOT NULL DEFAULT 'NONE';
