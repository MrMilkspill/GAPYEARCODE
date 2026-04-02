import type { Prisma } from "@prisma/client";

import { getDb } from "@/lib/db";
import type { PremedProfileInput } from "@/lib/validation/premed-profile";
import type { ScoreComputation } from "@/types/premed";

export const profileInclude = {
  scoreResult: true,
} satisfies Prisma.PremedProfileInclude;

function scoreResultData(result: ScoreComputation) {
  return {
    overallScore: result.overallScore,
    rawWeightedScore: result.rawWeightedScore,
    contextAdjustment: result.contextAdjustment,
    competitivenessTier: result.competitivenessTier,
    gapYearPrediction: result.gapYearPrediction,
    confidenceLevel: result.confidenceLevel,
    explanation: result.explanation,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    disclaimers: result.disclaimers,
    categoryBreakdown: result.categoryBreakdown as unknown as Prisma.InputJsonValue,
    categoryScores: result.categoryScores as unknown as Prisma.InputJsonValue,
    dynamicWeights: result.dynamicWeights as unknown as Prisma.InputJsonValue,
    comparisonMetrics: result.comparisonMetrics as unknown as Prisma.InputJsonValue,
    improvementPlan: result.improvementPlan as unknown as Prisma.InputJsonValue,
    narrative: result.narrative as unknown as Prisma.InputJsonValue,
  } satisfies Prisma.ScoreResultCreateWithoutProfileInput;
}

export async function listProfilesForUser(userId: string) {
  const db = getDb();
  return db.premedProfile.findMany({
    where: { userId },
    include: profileInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProfileForUser(userId: string, profileId: string) {
  const db = getDb();
  return db.premedProfile.findFirst({
    where: { id: profileId, userId },
    include: profileInclude,
  });
}

export async function createProfileRecord(
  userId: string,
  profile: PremedProfileInput,
  result: ScoreComputation,
) {
  const db = getDb();
  return db.premedProfile.create({
    data: {
      userId,
      ...profile,
      scoreResult: {
        create: scoreResultData(result),
      },
    },
    include: profileInclude,
  });
}

export async function updateProfileRecord(
  userId: string,
  profileId: string,
  profile: PremedProfileInput,
  result: ScoreComputation,
) {
  const db = getDb();
  const existing = await db.premedProfile.findFirst({
    where: { id: profileId, userId },
    select: { id: true, scoreResult: { select: { id: true } } },
  });

  if (!existing) {
    return null;
  }

  return db.premedProfile.update({
    where: { id: existing.id },
    data: {
      ...profile,
      scoreResult: existing.scoreResult
        ? {
            update: scoreResultData(result),
          }
        : {
            create: scoreResultData(result),
          },
    },
    include: profileInclude,
  });
}

export async function deleteProfileRecord(userId: string, profileId: string) {
  const db = getDb();
  const existing = await db.premedProfile.findFirst({
    where: { id: profileId, userId },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await db.premedProfile.delete({
    where: { id: existing.id },
  });

  return true;
}
