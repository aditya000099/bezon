-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'HOLDING', 'SETTLED', 'REFUNDED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "settled_at" TIMESTAMPTZ,
ADD COLUMN     "settlement_amount" DECIMAL(12,2),
ADD COLUMN     "settlement_held_at" TIMESTAMPTZ,
ADD COLUMN     "settlement_released_at" TIMESTAMPTZ,
ADD COLUMN     "settlement_status" "SettlementStatus" NOT NULL DEFAULT 'PENDING';
