import { getTimezoneOffset } from 'date-fns-tz';

let tzCache: Record<string, string> = {};

async function fetchIANATimezone(lat: number, lng: number): Promise<string | null> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (tzCache[key]) return tzCache[key];
  try {
    const url = `https://api.bigdatacloud.net/data/timezone-by-location?latitude=${lat}&longitude=${lng}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    const tz = data?.timeZone as string | undefined;
    if (tz) { tzCache[key] = tz; return tz; }
  } catch {}
  return null;
}

/**
 * Returns UTC offset in **hours** for a given local date/time at the specified coordinates.
 * Uses the BigDataCloud free API to look up the IANA timezone, then applies
 * date-fns-tz to handle historical DST rules correctly.
 *
 * Falls back to 0 (UTC) when the API is unavailable or coordinates are unknown.
 */
export async function resolveUTCOffset(
  lat: number | null | undefined,
  lng: number | null | undefined,
  localDateStr: string,   // YYYY-MM-DD
  localTimeStr: string,   // HH:MM  (24-hour)
): Promise<number> {
  if (lat == null || lng == null) return 0;
  const tz = await fetchIANATimezone(lat, lng);
  if (!tz) return 0;
  try {
    // Build a representative Date that date-fns-tz can inspect.
    // We treat the local time as if it were UTC to build the Date, then
    // getTimezoneOffset tells us how many ms the timezone differs from UTC.
    const dateStr = `${localDateStr}T${localTimeStr}:00.000Z`;
    const d = new Date(dateStr);
    const offsetMs = getTimezoneOffset(tz, d);
    // offsetMs is negative for zones west of UTC (e.g. -14400000 for UTC-4).
    // UTC = local - offset  →  offset in hours = offsetMs / 3_600_000
    return offsetMs / 3_600_000;
  } catch {
    return 0;
  }
}
