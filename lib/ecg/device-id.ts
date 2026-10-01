/** Canonical device IDs use `ECG_###` (e.g. firmware `ECG001` → `ECG_001`). */
export function normalizeDeviceId(raw: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/-/g, "_");
  const match = trimmed.match(/^ECG_?(\d+)$/);
  if (match) {
    return `ECG_${match[1].padStart(3, "0")}`;
  }
  return trimmed;
}

export function normalizeIngestDeviceId<T extends { deviceId: string }>(
  body: T,
): T {
  return { ...body, deviceId: normalizeDeviceId(body.deviceId) };
}
