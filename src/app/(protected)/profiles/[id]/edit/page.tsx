import { notFound, redirect } from "next/navigation";

import { ProfileForm } from "@/components/forms/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";
import { toProfileFormValues } from "@/lib/profile-adapter";
import { getProfileForUser } from "@/lib/profiles/repository";

type EditProfilePageProps = {
  params: {
    id: string;
  };
};

export default async function EditProfilePage({
  params,
}: EditProfilePageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfileForUser(user.id, params.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.25em] text-primary">
          Edit profile
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Update your application snapshot
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Adjust hours, materials, or school-list preferences and rescore the
          profile with the same transparent benchmark model.
        </p>
      </div>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardContent className="p-6">
          <ProfileForm
            mode="edit"
            profileId={profile.id}
            initialValues={toProfileFormValues(profile)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
