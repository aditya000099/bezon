-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'READY', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "refund_amount" DECIMAL(12,2),
ADD COLUMN     "refund_eligible_at" TIMESTAMPTZ,
ADD COLUMN     "refund_failure_reason" TEXT,
ADD COLUMN     "refund_initiated_at" TIMESTAMPTZ,
ADD COLUMN     "refund_processed_by_id" UUID,
ADD COLUMN     "refund_status" "RefundStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "refunded_at" TIMESTAMPTZ;
