-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('return', 'refund', 'replace');

-- CreateTable
CREATE TABLE "policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "PolicyType" NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "duration_days" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_id" UUID NOT NULL,
    "policy_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "policies_type_idx" ON "policies"("type");

-- CreateIndex
CREATE INDEX "policies_is_active_idx" ON "policies"("is_active");

-- CreateIndex
CREATE INDEX "product_policies_product_id_idx" ON "product_policies"("product_id");

-- CreateIndex
CREATE INDEX "product_policies_policy_id_idx" ON "product_policies"("policy_id");

-- CreateIndex
CREATE UNIQUE INDEX "pp_unique" ON "product_policies"("product_id", "policy_id");

-- AddForeignKey
ALTER TABLE "product_policies" ADD CONSTRAINT "pp_product_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_policies" ADD CONSTRAINT "pp_policy_fk" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
