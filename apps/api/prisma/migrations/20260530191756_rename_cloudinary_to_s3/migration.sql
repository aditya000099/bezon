/*
  Warnings:

  - You are about to drop the column `proof_cloudinary_id` on the `deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `cloudinary_id` on the `product_images` table. All the data in the column will be lost.
  - You are about to drop the `refresh_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "rt_user_fk";

-- AlterTable
ALTER TABLE "deliveries" DROP COLUMN "proof_cloudinary_id",
ADD COLUMN     "proof_s3_key" TEXT;

-- AlterTable
ALTER TABLE "product_images" DROP COLUMN "cloudinary_id",
ADD COLUMN     "s3_key" TEXT;

-- DropTable
DROP TABLE "refresh_tokens";
