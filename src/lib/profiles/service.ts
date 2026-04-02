import { calculateProfileReadiness } from "@/lib/scoring/engine";
import {
  premedProfileSchema,
  type PremedProfileInput,
} from "@/lib/validation/premed-profile";
import type { BenchmarkConfig, ScoreComputation } from "@/types/premed";

export interface ProfileStore {
  createProfile: (
    userId: string,
    input: PremedProfileInput,
    result: ScoreComputation,
  ) => Promise<unknown>;
  updateProfile: (
    userId: string,
    profileId: string,
    input: PremedProfileInput,
    result: ScoreComputation,
  ) => Promise<unknown>;
}

async function getPrismaProfileStore(): Promise<ProfileStore> {
  const { createProfileRecord, updateProfileRecord } = await import("./repository");

  return {
    createProfile: createProfileRecord,
    updateProfile: updateProfileRecord,
  };
}

export function buildProfileSubmission(
  input: unknown,
  benchmarks: BenchmarkConfig,
) {
  const profile = premedProfileSchema.parse(input);
  const result = calculateProfileReadiness(profile, benchmarks);

  return {
    profile,
    result,
  };
}

export async function prepareProfileSubmission(input: unknown) {
  const { getActiveBenchmarkConfig } = await import("../benchmarks/service");
  const benchmarks = await getActiveBenchmarkConfig();
  return buildProfileSubmission(input, benchmarks);
}

export async function createProfileForUser(userId: string, input: unknown) {
  const { profile, result } = await prepareProfileSubmission(input);
  const profileStore = await getPrismaProfileStore();
  return profileStore.createProfile(userId, profile, result);
}

export async function updateProfileForUser(
  userId: string,
  profileId: string,
  input: unknown,
) {
  const { profile, result } = await prepareProfileSubmission(input);
  const profileStore = await getPrismaProfileStore();
  return profileStore.updateProfile(userId, profileId, profile, result);
}
