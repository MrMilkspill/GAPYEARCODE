import type { PremedProfile } from "@prisma/client";

import type { PremedProfileFormValues } from "@/lib/validation/premed-profile";

export function toProfileFormValues(
  profile: PremedProfile,
): PremedProfileFormValues {
  const { id, userId, createdAt, updatedAt, ...values } = profile;
  void id;
  void userId;
  void createdAt;
  void updatedAt;

  return {
    ...values,
    minor: values.minor ?? "",
    gapYearPlans: values.gapYearPlans ?? "",
  };
}
