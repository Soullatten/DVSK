-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "dispatchedAt" TIMESTAMP(3),
ADD COLUMN     "shipmentNotes" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "weight" TEXT;
