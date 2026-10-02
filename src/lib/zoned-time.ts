// Timezone helpers without extra dependencies (Intl only).

export function zonedParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const m: Record<string, string> = {};
  for (const p of parts) m[p.type] = p.value;
  return {
    y: Number(m["year"]),
    mo: Number(m["month"]),
    d: Number(m["day"]),
    h: Number(m["hour"]),
    mi: Number(m["minute"]),
    s: Number(m["second"]),
    weekday: m["weekday"] ?? "",
  };
}

function offsetMin(date: Date, tz: string) {
  const p = zonedParts(date, tz);
  return (Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - date.getTime()) / 60000;
}

export function zonedToUtc(
  y: number,
  mo: number,
  d: number,
  minutesOfDay: number,
  tz: string,
): Date {
  const guess = Date.UTC(y, mo - 1, d, Math.floor(minutesOfDay / 60), minutesOfDay % 60);
  const first = new Date(guess - offsetMin(new Date(guess), tz) * 60000);
  return new Date(guess - offsetMin(first, tz) * 60000);
}

export function formatInZone(iso: string | Date, tz: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, ...opts }).format(new Date(iso));
}

export const fmtTime = (iso: string | Date, tz: string) =>
  formatInZone(iso, tz, { hour: "numeric", minute: "2-digit", hour12: true });
export const fmtDay = (iso: string | Date, tz: string) =>
  formatInZone(iso, tz, { weekday: "long" });
export const fmtDate = (iso: string | Date, tz: string) =>
  formatInZone(iso, tz, { month: "short", day: "numeric" });
export const fmtFull = (iso: string | Date, tz: string) =>
  formatInZone(iso, tz, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });