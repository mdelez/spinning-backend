-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "autoBook" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyCount" INTEGER NOT NULL DEFAULT 0;
