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
    return interpolate(value, range.strong, range.excellent, 85, 100);
  }
  if (value >= range.moderate) {
    return interpolate(value, range.moderate, range.strong, 65, 85);
  }
  if (value >= range.minimum) {
    return interpolate(value, range.minimum, range.moderate, 40, 65);
  }

  if (range.minimum === 0) {
    return clamp(interpolate(value, 0, 1, 15, 35), 15, 35);
  }

  return clamp(interpolate(value, 0, range.minimum, 15, 40), 10, 40);
}

export function scoreLowerIsBetter(value: number, range: LowerIsBetterRange) {
  if (value <= range.excellent) {
    return 100;
  }
  if (value <= range.strong) {
    return interpolate(value, range.excellent, range.strong, 100, 85);
  }
  if (value <= range.moderate) {
    return interpolate(value, range.strong, range.moderate, 85, 65);
  }
  if (value <= range.caution) {
    return interpolate(value, range.moderate, range.caution, 65, 35);
  }

  return 20;
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
