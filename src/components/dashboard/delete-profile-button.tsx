"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type DeleteProfileButtonProps = {
  profileId: string;
  profileName: string;
};

export function DeleteProfileButton({
  profileId,
  profileName,
}: DeleteProfileButtonProps) {
  const router = useRouter();
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
          const response = await fetch(`/api/profiles/${profileId}`, {
            method: "DELETE",
          });

          let payload: { error?: string } | null = null;

          try {
            payload = (await response.json()) as { error?: string };
          } catch {
            payload = null;
          }

          if (!response.ok) {
            toast.error(payload?.error ?? "Unable to delete profile.");
            return;
          }

          toast.success("Profile deleted.");
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" />
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
