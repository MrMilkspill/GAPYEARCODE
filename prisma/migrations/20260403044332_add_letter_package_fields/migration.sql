-- AlterTable
ALTER TABLE "PremedProfile" ADD COLUMN     "clinicalSupervisorLetters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "committeeLetter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nonScienceProfessorLetters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "researchMentorLetters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "scienceProfessorLetters" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "serviceWorkSupervisorLetters" INTEGER NOT NULL DEFAULT 0;
