export function formatTime(
  value: Date | number | string,
  withSeconds = true,
): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
  });
}

export function formatDateTime(value: Date | number | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString();
}

export function formatScore(score: number): string {
  return score.toFixed(2);
}
