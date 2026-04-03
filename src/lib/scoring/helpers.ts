import type {
  BenchmarkRange,
  ComparisonMetric,
  ComparisonStatus,
  LowerIsBetterRange,
  MetricUnit,
} from "@/types/premed";

export function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

export function interpolate(
  value: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number,
) {
  if (inputMax === inputMin) {
    return outputMax;
  }

  const ratio = (value - inputMin) / (inputMax - inputMin);
  return outputMin + ratio * (outputMax - outputMin);
}

export function scoreFromThresholds(value: number, range: BenchmarkRange) {
  if (value >= range.excellent) {
    return 100;
  }
  if (value >= range.strong) {
    return interpolate(value, range.strong, range.excellent, 74, 90);
  }
  if (value >= range.moderate) {
    return interpolate(value, range.moderate, range.strong, 52, 74);
  }
  if (value >= range.minimum) {
    return interpolate(value, range.minimum, range.moderate, 28, 52);
  }

  if (range.minimum === 0) {
    return clamp(interpolate(value, 0, 1, 8, 22), 8, 22);
  }

  return clamp(interpolate(value, 0, range.minimum, 8, 28), 8, 28);
}

export function scoreWithinPreferredBand(
  value: number,
  range: BenchmarkRange,
  preferredMaximum: number,
  options?: {
    overPreferredStartScore?: number;
    softPenaltySpan?: number;
    hardPenaltySpan?: number;
    softPenaltyFloor?: number;
    hardPenaltyFloor?: number;
  },
) {
  if (value <= preferredMaximum) {
    return scoreFromThresholds(value, range);
  }

  const softPenaltySpan =
    options?.softPenaltySpan ?? Math.max(20, preferredMaximum / 2);
  const hardPenaltySpan =
    options?.hardPenaltySpan ?? Math.max(40, preferredMaximum);
  const overPreferredStartScore = options?.overPreferredStartScore ?? 100;
  const softPenaltyFloor = options?.softPenaltyFloor ?? 84;
  const hardPenaltyFloor = options?.hardPenaltyFloor ?? 68;
  const softPenaltyMax = preferredMaximum + softPenaltySpan;
  const hardPenaltyMax = softPenaltyMax + hardPenaltySpan;

  if (value <= softPenaltyMax) {
    return interpolate(
      value,
      preferredMaximum,
      softPenaltyMax,
      overPreferredStartScore,
      softPenaltyFloor,
    );
  }

  if (value <= hardPenaltyMax) {
    return interpolate(
      value,
      softPenaltyMax,
      hardPenaltyMax,
      softPenaltyFloor,
      hardPenaltyFloor,
    );
  }

  return hardPenaltyFloor;
}

export function scoreLowerIsBetter(value: number, range: LowerIsBetterRange) {
  if (value <= range.excellent) {
    return 100;
  }
  if (value <= range.strong) {
    return interpolate(value, range.excellent, range.strong, 100, 90);
  }
  if (value <= range.moderate) {
    return interpolate(value, range.strong, range.moderate, 90, 72);
  }
  if (value <= range.caution) {
    return interpolate(value, range.moderate, range.caution, 72, 38);
  }

  return 18;
}

export function weightedAverage(
  items: Array<{ score: number; weight: number }>,
) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) {
    return 0;
  }

  return (
    items.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight
  );
}

export function textDepthScore(
  value: string,
  moderateLength = 80,
  strongLength = 180,
) {
  const length = value.trim().length;

  if (length >= strongLength) {
    return 95;
  }
  if (length >= moderateLength) {
    return interpolate(length, moderateLength, strongLength, 65, 95);
  }
  if (length > 0) {
    return interpolate(length, 1, moderateLength, 30, 65);
  }

  return 15;
}

export function countUnique(values: string[]) {
  return new Set(
    values.map((value) => value.trim().toLowerCase()).filter(Boolean),
  ).size;
}

export function getComparisonStatus(
  userValue: number,
  targetValue: number,
): ComparisonStatus {
  if (targetValue === 0) {
    return "ahead";
  }

  const ratio = userValue / targetValue;
  if (ratio >= 1) {
    return "ahead";
  }
  if (ratio >= 0.75) {
    return "on_track";
  }
  return "below";
}

export function createComparisonMetric(
  key: string,
  label: string,
  userValue: number,
  targetValue: number,
  unit: MetricUnit,
): ComparisonMetric {
  return {
    key,
    label,
    userValue,
    targetValue,
    unit,
    status: getComparisonStatus(userValue, targetValue),
  };
}

export function formatMetric(value: number, unit: MetricUnit) {
  switch (unit) {
    case "gpa":
      return value.toFixed(2);
    case "percent":
      return `${Math.round(value)}%`;
    default:
      return `${Math.round(value)}`;
  }
}
