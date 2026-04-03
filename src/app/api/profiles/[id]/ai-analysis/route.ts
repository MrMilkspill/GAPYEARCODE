import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { getActiveBenchmarkConfig } from "@/lib/benchmarks/service";
import { generateMistralProfileAnalysis } from "@/lib/ai/mistral";
import { getProfileForUser } from "@/lib/profiles/repository";
import { buildProfileSubmission } from "@/lib/profiles/service";

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
  const submission = buildProfileSubmission(profile, benchmarks);

  try {
    const result = await generateMistralProfileAnalysis(
      submission.profile,
      submission.result,
      benchmarks,
    );

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown AI analysis error.";
    const status = message.includes("not configured") ? 503 : 502;

    return NextResponse.json(
      {
        error: message,
      },
      { status },
    );
  }
}
