/*
  Warnings:

  - You are about to alter the column `tokenPrice` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Ride" ALTER COLUMN "tokenPrice" SET DEFAULT 1,
ALTER COLUMN "tokenPrice" SET DATA TYPE INTEGER;
