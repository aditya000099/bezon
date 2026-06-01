/*
  Warnings:

  - You are about to drop the column `product_id` on the `product_images` table. All the data in the column will be lost.
  - Added the required column `variant_id` to the `product_images` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "product_images" DROP CONSTRAINT "pi_product_fk";

-- DropIndex
DROP INDEX "product_images_product_id_idx";

-- AlterTable
ALTER TABLE "product_images" DROP COLUMN "product_id",
ADD COLUMN     "variant_id" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "product_images_variant_id_idx" ON "product_images"("variant_id");

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "pi_variant_fk" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
