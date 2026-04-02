import type { BenchmarkConfig as BenchmarkConfigRecord } from "@prisma/client";

import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import { db } from "@/lib/db";
import type { BenchmarkConfig } from "@/types/premed";

export async function getActiveBenchmarkConfig(): Promise<BenchmarkConfig> {
  const config = await db.benchmarkConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!config) {
    return defaultBenchmarkConfig;
  }

  return parseBenchmarkConfigRecord(config);
}

export function parseBenchmarkConfigRecord(
  config: Pick<BenchmarkConfigRecord, "config">,
): BenchmarkConfig {
  return config.config as unknown as BenchmarkConfig;
}
