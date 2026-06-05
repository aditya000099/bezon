-- CreateEnum
CREATE TYPE "DeliveryPartnerStatus" AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- AlterTable
ALTER TABLE "delivery_partners" ADD COLUMN     "aadhaar_number" VARCHAR(20),
ADD COLUMN     "approved_at" TIMESTAMPTZ,
ADD COLUMN     "approved_by" UUID,
ADD COLUMN     "driving_license" VARCHAR(20),
ADD COLUMN     "emergency_contact_name" VARCHAR(100),
ADD COLUMN     "emergency_contact_phone" VARCHAR(20),
ADD COLUMN     "pan_number" VARCHAR(10),
ADD COLUMN     "rejected_at" TIMESTAMPTZ,
ADD COLUMN     "rejected_by" UUID,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status" "DeliveryPartnerStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "suspended_at" TIMESTAMPTZ,
ADD COLUMN     "suspended_by" UUID,
ALTER COLUMN "is_available" SET DEFAULT false;

-- CreateIndex
CREATE INDEX "delivery_partners_status_idx" ON "delivery_partners"("status");
