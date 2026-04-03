import type {
  AiAnalysisSource,
  AiProfileAnalysis,
  AiSourceBackedComparison,
  SavedPremedProfile,
  SavedPremedProfileResponse,
} from "@/types/api";
import type { PremedProfileInput } from "@/lib/validation/premed-profile";

import { backendRequest } from "@/lib/api/client";


function reviveProfile(profile: SavedPremedProfileResponse): SavedPremedProfile {
  return {
    ...profile,
    createdAt: new Date(profile.createdAt),
    updatedAt: new Date(profile.updatedAt),
  };
}


export async function listProfiles() {
  const response = await backendRequest<{
    profiles: SavedPremedProfileResponse[];
  }>("/profiles");

  return response.profiles.map(reviveProfile);
}


export async function getProfile(profileId: string) {
  const response = await backendRequest<{
    profile: SavedPremedProfileResponse;
  }>(`/profiles/${profileId}`);

  return reviveProfile(response.profile);
}


export async function createProfile(payload: PremedProfileInput) {
  const response = await backendRequest<{
    profile: SavedPremedProfileResponse;
  }>("/profiles", {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return reviveProfile(response.profile);
}


export async function updateProfile(
  profileId: string,
  payload: PremedProfileInput,
) {
  const response = await backendRequest<{
    profile: SavedPremedProfileResponse;
  }>(`/profiles/${profileId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });

  return reviveProfile(response.profile);
}


export async function deleteProfile(profileId: string) {
  await backendRequest<void>(`/profiles/${profileId}`, {
    method: "DELETE",
  });
}


export async function generateAiAnalysis(profileId: string) {
  return backendRequest<{
    analysis: AiProfileAnalysis;
    comparisons: AiSourceBackedComparison[];
    model: string | null;
    sources: AiAnalysisSource[];
  }>(`/profiles/${profileId}/ai-analysis`);
}
