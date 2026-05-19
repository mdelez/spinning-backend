/*
  Warnings:

  - You are about to drop the column `tokenPrice` on the `Ride` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "tokenPrice",
ADD COLUMN     "tokenPriceUnits" INTEGER NOT NULL DEFAULT 1;
