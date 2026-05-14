-- CreateEnum
CREATE TYPE "RideTokenTransactionType" AS ENUM ('PURCHASE', 'BOOKING', 'REFUND', 'MANUAL_ADJUSTMENT');

-- CreateTable
CREATE TABLE "RideTokenTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountUnits" INTEGER NOT NULL,
    "type" "RideTokenTransactionType" NOT NULL,
    "rideId" TEXT,

    CONSTRAINT "RideTokenTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RideTokenTransaction" ADD CONSTRAINT "RideTokenTransaction_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideTokenTransaction" ADD CONSTRAINT "RideTokenTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
