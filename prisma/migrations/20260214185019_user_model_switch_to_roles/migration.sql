/*
  Warnings:

  - You are about to drop the column `admin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `instructor` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'INSTRUCTOR', 'ADMIN');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "admin",
DROP COLUMN "instructor",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
