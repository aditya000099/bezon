-- AlterTable
ALTER TABLE "ad_campaigns" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
