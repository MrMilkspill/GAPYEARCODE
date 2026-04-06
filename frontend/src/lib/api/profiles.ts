import type {
  AiAnalysisSource,
  AiProfileAnalysis,
  AiSourceBackedComparison,
  SavedPremedProfile,
  SavedPremedProfileResponse,
} from "@/types/api";
import type { PremedProfileInput } from "@/lib/validation/premed-profile";

import { ApiError, backendRequest } from "@/lib/api/client";


function isMissingProfilesTable(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    /PGRST205|public\.profiles|schema cache/i.test(error.message)
  );
}


function getProfilesTableMessage() {
  return (
    "Profiles storage is not initialized yet. Run the Supabase profiles SQL " +
    "before saving or loading profiles."
  );
}


function reviveProfile(profile: SavedPremedProfileResponse): SavedPremedProfile {
  return {
    ...profile,
    createdAt: new Date(profile.createdAt),
    updatedAt: new Date(profile.updatedAt),
  };
}


export async function listProfiles() {
  try {
    const response = await backendRequest<{
      profiles: SavedPremedProfileResponse[];
    }>("/profiles");

    return response.profiles.map(reviveProfile);
  } catch (error) {
    if (isMissingProfilesTable(error)) {
      return [];
    }

    throw error;
  }
}


export async function getProfile(profileId: string) {
  try {
    const response = await backendRequest<{
      profile: SavedPremedProfileResponse;
    }>(`/profiles/${profileId}`);

    return reviveProfile(response.profile);
  } catch (error) {
    if (isMissingProfilesTable(error)) {
      throw new ApiError(getProfilesTableMessage(), error.status);
    }

    throw error;
  }
}


export async function createProfile(payload: PremedProfileInput) {
  try {
    const response = await backendRequest<{
      profile: SavedPremedProfileResponse;
    }>("/profiles", {
      body: JSON.stringify(payload),
      method: "POST",
    });

    return reviveProfile(response.profile);
  } catch (error) {
    if (isMissingProfilesTable(error)) {
      throw new ApiError(getProfilesTableMessage(), error.status);
    }

    throw error;
  }
}


export async function updateProfile(
  profileId: string,
  payload: PremedProfileInput,
) {
  try {
    const response = await backendRequest<{
      profile: SavedPremedProfileResponse;
    }>(`/profiles/${profileId}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    });

    return reviveProfile(response.profile);
  } catch (error) {
    if (isMissingProfilesTable(error)) {
      throw new ApiError(getProfilesTableMessage(), error.status);
    }

    throw error;
  }
}


export async function deleteProfile(profileId: string) {
  try {
    await backendRequest<void>(`/profiles/${profileId}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (isMissingProfilesTable(error)) {
      throw new ApiError(getProfilesTableMessage(), error.status);
    }

    throw error;
  }
}


export async function generateAiAnalysis(profileId: string) {
  try {
    return await backendRequest<{
      analysis: AiProfileAnalysis;
      comparisons: AiSourceBackedComparison[];
      model: string | null;
      sources: AiAnalysisSource[];
    }>(`/profiles/${profileId}/ai-analysis`);
  } catch (error) {
    if (isMissingProfilesTable(error)) {
      throw new ApiError(getProfilesTableMessage(), error.status);
    }

    throw error;
  }
}
