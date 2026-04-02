import { NextResponse } from "next/server";

import { getActiveBenchmarkConfig } from "@/lib/benchmarks/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getActiveBenchmarkConfig();
  return NextResponse.json({ config });
}
