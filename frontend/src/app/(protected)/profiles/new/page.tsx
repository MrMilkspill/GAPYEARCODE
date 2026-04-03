"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { ProfileForm } from "@/components/forms/profile-form";
import { Card, CardContent } from "@/components/ui/card";


export default function NewProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.25em] text-primary">
          New profile
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Build a full application snapshot
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Fill out your academics, experiences, and application readiness. Saving
          the profile immediately generates a readiness score and gap year estimate.
        </p>
      </div>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardContent className="p-6">
          <ProfileForm
            mode="create"
            initialValues={{
              email: user?.email ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
