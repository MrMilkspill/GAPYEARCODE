import type { PremedProfileFormValues } from "@/lib/validation/premed-profile";
import type { SavedPremedProfile } from "@/types/api";

export function toProfileFormValues(
  profile: SavedPremedProfile,
): PremedProfileFormValues {
  const { id, userId, createdAt, updatedAt, scoreResult, ...values } = profile;
  void id;
  void userId;
  void createdAt;
  void updatedAt;
  void scoreResult;

  return {
    ...values,
    minor: values.minor ?? "",
    gapYearPlans: values.gapYearPlans ?? "",
  };
}
