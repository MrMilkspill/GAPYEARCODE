"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteProfile } from "@/lib/api/profiles";

type DeleteProfileButtonProps = {
  onDeleted?: () => void;
  profileId: string;
  profileName: string;
};

export function DeleteProfileButton({
  onDeleted,
  profileId,
  profileName,
}: DeleteProfileButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        const confirmed = window.confirm(
          `Delete the saved profile for ${profileName}? This cannot be undone.`,
        );

        if (!confirmed) {
          return;
        }

        startTransition(async () => {
          try {
            await deleteProfile(profileId);
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Unable to delete profile.",
            );
            return;
          }

          toast.success("Profile deleted.");
          onDeleted?.();
        });
      }}
    >
      <Trash2 className="size-4" />
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
