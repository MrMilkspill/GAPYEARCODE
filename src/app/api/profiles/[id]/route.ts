import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getActiveBenchmarkConfig } from "@/lib/benchmarks/service";
import {
  deleteProfileRecord,
  getProfileForUser,
} from "@/lib/profiles/repository";
import { buildProfileSubmission, updateProfileForUser } from "@/lib/profiles/service";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profile = await getProfileForUser(user.id, params.id);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const benchmarks = await getActiveBenchmarkConfig();
  const rescoredProfile = {
    ...profile,
    scoreResult: buildProfileSubmission(profile, benchmarks).result,
  };

  return NextResponse.json({ profile: rescoredProfile });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const profile = await updateProfileForUser(user.id, params.id, body);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update profile.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const deleted = await deleteProfileRecord(user.id, params.id);

  if (!deleted) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
