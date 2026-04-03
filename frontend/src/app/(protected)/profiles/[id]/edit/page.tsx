"use client";

import { useEffect, useState } from "react";

import { ProfileForm } from "@/components/forms/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile } from "@/lib/api/profiles";
import { toProfileFormValues } from "@/lib/profile-adapter";
import type { SavedPremedProfile } from "@/types/api";


type EditProfilePageProps = {
  params: {
    id: string;
  };
};


export default function EditProfilePage({ params }: EditProfilePageProps) {
  const [profile, setProfile] = useState<SavedPremedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const nextProfile = await getProfile(params.id);

        if (!cancelled) {
          setProfile(nextProfile);
          setError(null);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load this profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

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
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : profile ? (
            <ProfileForm
              mode="edit"
              profileId={profile.id}
              initialValues={toProfileFormValues(profile)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Profile not found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
