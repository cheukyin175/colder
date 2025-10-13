-- AlterTable
ALTER TABLE "User" ADD COLUMN     "openrouterApiKey" TEXT,
ADD COLUMN     "openrouterModel" TEXT DEFAULT 'openai/gpt-4o',
ADD COLUMN     "userBackground" TEXT,
ADD COLUMN     "userCompany" TEXT,
ADD COLUMN     "userName" TEXT,
ADD COLUMN     "userOutreachObjectives" TEXT DEFAULT 'General Connection',
ADD COLUMN     "userRole" TEXT,
ADD COLUMN     "userValueProposition" TEXT;
