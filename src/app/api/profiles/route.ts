import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { listProfilesForUser } from "@/lib/profiles/repository";
import { createProfileForUser } from "@/lib/profiles/service";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profiles = await listProfilesForUser(user.id);
  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();

  try {
    const profile = await createProfileForUser(user.id, body);
    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to save profile.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
