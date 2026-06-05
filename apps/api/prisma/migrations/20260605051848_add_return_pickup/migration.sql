-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReturnStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "ReturnStatus" ADD VALUE 'PICKED_UP';
ALTER TYPE "ReturnStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "return_assigned_at" TIMESTAMPTZ,
ADD COLUMN     "return_completed_at" TIMESTAMPTZ,
ADD COLUMN     "return_partner_id" UUID,
ADD COLUMN     "return_picked_up_at" TIMESTAMPTZ;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_return_partner_fk" FOREIGN KEY ("return_partner_id") REFERENCES "delivery_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
