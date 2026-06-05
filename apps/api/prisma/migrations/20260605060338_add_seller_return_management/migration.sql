-- CreateEnum
CREATE TYPE "ReturnInspectionStatus" AS ENUM ('PENDING_INSPECTION', 'RESTOCKED', 'DAMAGED', 'DISPOSED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "return_inspected_at" TIMESTAMPTZ,
ADD COLUMN     "return_inspected_by_id" UUID,
ADD COLUMN     "return_inspection_notes" TEXT,
ADD COLUMN     "return_inspection_status" "ReturnInspectionStatus" NOT NULL DEFAULT 'PENDING_INSPECTION';

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_return_inspected_by_fk" FOREIGN KEY ("return_inspected_by_id") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
