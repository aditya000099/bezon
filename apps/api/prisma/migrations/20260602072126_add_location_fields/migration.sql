-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "lat" DECIMAL(9,6),
ADD COLUMN     "lng" DECIMAL(9,6);

-- AlterTable
ALTER TABLE "delivery_partners" ADD COLUMN     "address_line" VARCHAR(200),
ADD COLUMN     "city" VARCHAR(80),
ADD COLUMN     "lat" DECIMAL(9,6),
ADD COLUMN     "lng" DECIMAL(9,6),
ADD COLUMN     "pincode" VARCHAR(10),
ADD COLUMN     "state" VARCHAR(80);

-- AlterTable
ALTER TABLE "sellers" ADD COLUMN     "address_line" VARCHAR(200),
ADD COLUMN     "city" VARCHAR(80),
ADD COLUMN     "lat" DECIMAL(9,6),
ADD COLUMN     "lng" DECIMAL(9,6),
ADD COLUMN     "pincode" VARCHAR(10),
ADD COLUMN     "state" VARCHAR(80);
