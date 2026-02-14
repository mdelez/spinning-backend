/*
  Warnings:

  - You are about to drop the column `status` on the `Booking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "status",
ADD COLUMN     "friendEmail" TEXT,
ADD COLUMN     "friendName" TEXT,
ADD COLUMN     "friendShoeSize" INTEGER,
ADD COLUMN     "friendWaiverSigned" BOOLEAN;
