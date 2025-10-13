/*
  Warnings:

  - You are about to drop the column `openrouterModel` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "openrouterModel";

-- CreateTable
CREATE TABLE "GeneratedProfile" (
    "id" TEXT NOT NULL,
    "linkedinUrl" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "basicInformation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GeneratedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedProfile_userId_linkedinUrl_key" ON "GeneratedProfile"("userId", "linkedinUrl");

-- AddForeignKey
ALTER TABLE "GeneratedProfile" ADD CONSTRAINT "GeneratedProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
