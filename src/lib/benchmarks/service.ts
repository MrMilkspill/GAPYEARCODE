import type { BenchmarkConfig as BenchmarkConfigRecord } from "@prisma/client";

import { defaultBenchmarkConfig } from "@/lib/benchmarks/defaults";
import { getDb } from "@/lib/db";
import type { BenchmarkConfig } from "@/types/premed";

export async function getActiveBenchmarkConfig(): Promise<BenchmarkConfig> {
  const db = getDb();
  const config = await db.benchmarkConfig.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!config) {
    return defaultBenchmarkConfig;
  }

  const parsedConfig = parseBenchmarkConfigRecord(config);

  if (
    config.name.startsWith("default-") &&
    parsedConfig.version !== defaultBenchmarkConfig.version
  ) {
    return defaultBenchmarkConfig;
  }

  return parsedConfig;
}

export function parseBenchmarkConfigRecord(
  config: Pick<BenchmarkConfigRecord, "config">,
): BenchmarkConfig {
  return config.config as unknown as BenchmarkConfig;
}
