-- CreateEnum
CREATE TYPE "CurrentYear" AS ENUM ('FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE', 'POST_BACC');

-- CreateEnum
CREATE TYPE "SchoolRigor" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ResearchType" AS ENUM ('BASIC_SCIENCE', 'CLINICAL', 'TRANSLATIONAL', 'PUBLIC_HEALTH', 'OTHER');

-- CreateEnum
CREATE TYPE "HighestLeadershipLevel" AS ENUM ('MEMBER', 'COMMITTEE', 'CHAIR', 'VICE_PRESIDENT', 'PRESIDENT', 'FOUNDER');

-- CreateEnum
CREATE TYPE "ApplicationInterest" AS ENUM ('MD', 'DO', 'BOTH');

-- CreateEnum
CREATE TYPE "LetterStrength" AS ENUM ('WEAK', 'AVERAGE', 'STRONG');

-- CreateEnum
CREATE TYPE "PersonalStatementStatus" AS ENUM ('NOT_STARTED', 'DRAFTING', 'STRONG_DRAFT', 'FINALIZED');

-- CreateEnum
CREATE TYPE "ActivitiesStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY');

-- CreateEnum
CREATE TYPE "SchoolListStatus" AS ENUM ('NOT_STARTED', 'DRAFTED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "CompetitivenessTier" AS ENUM ('VERY_STRONG', 'STRONG', 'BORDERLINE', 'NEEDS_IMPROVEMENT');

-- CreateEnum
CREATE TYPE "GapYearRecommendation" AS ENUM ('NO_GAP', 'ONE_GAP', 'TWO_PLUS_GAPS');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PremedProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "stateOfResidence" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "graduationYear" INTEGER NOT NULL,
    "currentYear" "CurrentYear" NOT NULL,
    "major" TEXT NOT NULL,
    "minor" TEXT,
    "honorsProgram" BOOLEAN NOT NULL,
    "cumulativeGpa" DOUBLE PRECISION NOT NULL,
    "scienceGpa" DOUBLE PRECISION NOT NULL,
    "mcatTotal" INTEGER NOT NULL,
    "mcatChemPhys" INTEGER NOT NULL,
    "mcatCars" INTEGER NOT NULL,
    "mcatBioBiochem" INTEGER NOT NULL,
    "mcatPsychSoc" INTEGER NOT NULL,
    "numberOfWithdrawals" INTEGER NOT NULL,
    "numberOfCsOrLower" INTEGER NOT NULL,
    "upwardGradeTrend" BOOLEAN NOT NULL,
    "schoolRigor" "SchoolRigor" NOT NULL,
    "paidClinicalHours" INTEGER NOT NULL,
    "clinicalVolunteerHours" INTEGER NOT NULL,
    "patientFacingHours" INTEGER NOT NULL,
    "clinicalExperienceTypes" TEXT[],
    "customClinicalExperienceTypes" TEXT[],
    "clinicalRoleDescription" TEXT NOT NULL,
    "shadowingTotalHours" INTEGER NOT NULL,
    "physiciansShadowed" INTEGER NOT NULL,
    "primaryCareShadowingHours" INTEGER NOT NULL,
    "specialtyShadowingHours" INTEGER NOT NULL,
    "virtualShadowingHours" INTEGER NOT NULL,
    "shadowingReflection" TEXT NOT NULL,
    "researchHours" INTEGER NOT NULL,
    "researchProjectsCount" INTEGER NOT NULL,
    "researchType" "ResearchType" NOT NULL,
    "postersPresentationsCount" INTEGER NOT NULL,
    "publicationsCount" INTEGER NOT NULL,
    "abstractsCount" INTEGER NOT NULL,
    "researchContribution" TEXT NOT NULL,
    "nonClinicalVolunteerHours" INTEGER NOT NULL,
    "underservedServiceHours" INTEGER NOT NULL,
    "serviceLeadership" BOOLEAN NOT NULL,
    "serviceCategories" TEXT[],
    "customServiceCategories" TEXT[],
    "serviceExperience" TEXT NOT NULL,
    "leadershipHours" INTEGER NOT NULL,
    "leadershipRolesCount" INTEGER NOT NULL,
    "highestLeadershipLevel" "HighestLeadershipLevel" NOT NULL,
    "leadershipDescription" TEXT NOT NULL,
    "paidNonClinicalWorkHours" INTEGER NOT NULL,
    "paidClinicalWorkHours" INTEGER NOT NULL,
    "employmentWhileInSchool" BOOLEAN NOT NULL,
    "workedDuringSemesters" BOOLEAN NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "clubsOrganizations" TEXT[],
    "hobbiesInterests" TEXT[],
    "sports" TEXT[],
    "creativeActivities" TEXT[],
    "longTermCommitments" TEXT[],
    "distinctivenessFactor" TEXT NOT NULL,
    "gapYearPlans" TEXT,
    "plannedApplicationCycle" TEXT NOT NULL,
    "plannedSchoolListSize" INTEGER NOT NULL,
    "applicationInterest" "ApplicationInterest" NOT NULL,
    "researchHeavyPreference" BOOLEAN NOT NULL,
    "serviceHeavyPreference" BOOLEAN NOT NULL,
    "stateSchoolPriority" BOOLEAN NOT NULL,
    "letterStrength" "LetterStrength" NOT NULL,
    "personalStatementReadiness" "PersonalStatementStatus" NOT NULL,
    "activitiesReadiness" "ActivitiesStatus" NOT NULL,
    "schoolListReadiness" "SchoolListStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremedProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreResult" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "rawWeightedScore" DOUBLE PRECISION NOT NULL,
    "contextAdjustment" DOUBLE PRECISION NOT NULL,
    "competitivenessTier" "CompetitivenessTier" NOT NULL,
    "gapYearPrediction" "GapYearRecommendation" NOT NULL,
    "confidenceLevel" "ConfidenceLevel" NOT NULL,
    "explanation" TEXT NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "disclaimers" TEXT[],
    "categoryBreakdown" JSONB NOT NULL,
    "categoryScores" JSONB NOT NULL,
    "dynamicWeights" JSONB NOT NULL,
    "comparisonMetrics" JSONB NOT NULL,
    "improvementPlan" JSONB NOT NULL,
    "narrative" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BenchmarkConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PremedProfile_userId_updatedAt_idx" ON "PremedProfile"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ScoreResult_profileId_key" ON "ScoreResult"("profileId");

-- CreateIndex
CREATE INDEX "ScoreResult_overallScore_idx" ON "ScoreResult"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkConfig_name_key" ON "BenchmarkConfig"("name");

-- AddForeignKey
ALTER TABLE "PremedProfile" ADD CONSTRAINT "PremedProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreResult" ADD CONSTRAINT "ScoreResult_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PremedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
