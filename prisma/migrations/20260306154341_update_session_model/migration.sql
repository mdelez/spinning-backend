/*
  Warnings:

  - You are about to drop the column `name` on the `Session` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RideType" AS ENUM ('NORMAL', 'EVENT', 'INTRO');

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "name",
ADD COLUMN     "rideType" "RideType" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "theme" TEXT,
ADD COLUMN     "tokenPrice" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ALTER COLUMN "description" DROP NOT NULL;
