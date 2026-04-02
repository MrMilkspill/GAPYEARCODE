import "dotenv/config";

import type { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { defaultBenchmarkConfig } from "../src/lib/benchmarks/defaults";
import { db } from "../src/lib/db";
import { createProfileRecord } from "../src/lib/profiles/repository";
import { calculateProfileReadiness } from "../src/lib/scoring/engine";
import { sampleProfiles } from "../src/lib/sample-profiles";

async function main() {
  await db.scoreResult.deleteMany();
  await db.premedProfile.deleteMany();
  await db.benchmarkConfig.deleteMany();
  await db.user.deleteMany({
    where: {
      email: "demo@premedgapyearpredictor.com",
    },
  });

  await db.benchmarkConfig.create({
    data: {
      name: "default-2026-04",
      description: "Default scoring weights and thresholds for the product scaffold.",
      isActive: true,
      config: defaultBenchmarkConfig as unknown as Prisma.InputJsonValue,
    },
  });

  const demoUser = await db.user.create({
    data: {
      name: "Demo Student",
      email: "demo@premedgapyearpredictor.com",
      passwordHash: await hash("GapYearDemo123", 12),
    },
  });

  for (const profile of sampleProfiles) {
    const result = calculateProfileReadiness(profile, defaultBenchmarkConfig);
    await createProfileRecord(demoUser.id, profile, result);
  }

  console.log("Seed complete.");
  console.log("Demo login: demo@premedgapyearpredictor.com / GapYearDemo123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
