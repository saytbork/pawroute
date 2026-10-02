import {
  estimateVisit,
  LEAD_TIME_HOURS,
  MAX_ADDED_TRAVEL_MIN,
  normalizePostal,
  PREFERENCES,
  type Details,
  type PreferenceId,
} from "./booking-rules";
import type { BusinessConfig } from "./config.server";
import { getRouteProvider, type Point } from "./routing.server";
import { fmtDate, fmtDay, fmtTime, zonedParts, zonedToUtc } from "./zoned-time";

export type RouteStatus = "optimized" | "not_configured" | "geocode_failed" | "provider_error";

export type SlotDTO = {
  start: string;
  end: string;
  blockEnd: string;
  dayLabel: string;
  dateLabel: string;
  timeLabel: string;
  finishLabel: string;
  addedTravelMin: number | null;
  prevArea: string | null;
  nextArea: string | null;
  preferenceMatch: "Perfect match" | "Good" | "Outside preference";
  impact: "low" | "medium" | "high" | "unknown";
  tag: string;
  reason: string;
  notOffered: boolean;
};

export type AvailabilityResult =
  | { outOfArea: true; postalCode: string | null }
  | {
      outOfArea: false;
      postalCode: string;
      routeStatus: RouteStatus;
      geocoded: Point | null;
      sameDayStops: boolean;
      minutes: number;
      bufferMin: number;
      slots: SlotDTO[];
    };

type Input = Pick<Details, "service" | "weightLb" | "nails" | "anxious" | "preference"> & {
  address: string;
  postalCode: string;
  excludeBookingId?: string;
};

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function isInServiceArea(cfg: BusinessConfig, postal: string | null) {
  if (!postal) return false;
  const fsa = postal.slice(0, 3);
  return cfg.servicePrefixes.some((p) => fsa.startsWith(p));
}

export async function computeAvailability(
  cfg: BusinessConfig,
  input: Input,
): Promise<AvailabilityResult> {
  const postal = normalizePostal(input.postalCode);
  if (!postal || !isInServiceArea(cfg, postal)) return { outOfArea: true, postalCode: postal };

  const est = estimateVisit(input);
  const tz = cfg.timezone;
  const now = new Date();
  const horizonEnd = new Date(now.getTime() + (cfg.horizonDays + 1) * 86400000);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  let q = supabaseAdmin
    .from("bookings")
    .select("id, scheduled_start, block_end, lat, lng, postal_code")
    .in("status", ["confirmed", "pending_review"])
    .gte("block_end", now.toISOString())
    .lt("scheduled_start", horizonEnd.toISOString())
    .order("scheduled_start");
  if (input.excludeBookingId) q = q.neq("id", input.excludeBookingId);
  const { data: rows, error } = await q;
  if (error) throw new Error("Could not read the schedule");
  const booked = (rows ?? [])
    .filter((b) => b.scheduled_start && b.block_end)
    .map((b) => ({
      start: new Date(b.scheduled_start!).getTime(),
      blockEnd: new Date(b.block_end!).getTime(),
      point: b.lat != null && b.lng != null ? { lat: b.lat, lng: b.lng } : null,
      area: b.postal_code ? b.postal_code.slice(0, 3) : "Existing stop",
    }));

  // Route provider: geocode the new address and build one travel matrix.
  let routeStatus: RouteStatus = "not_configured";
  let geocoded: Point | null = null;
  let matrix: number[][] | null = null;
  const points: Point[] = [];
  const indexOf = new Map<object, number>();
  let baseIdx: number | null = null;
  const provider = getRouteProvider();
  if (provider) {
    const g = await provider.geocode(`${input.address}, ${postal}, ${cfg.city}`).catch(() => null);
    if (!g) routeStatus = "geocode_failed";
    else {
      geocoded = { lat: g.lat, lng: g.lng };
      points.push(geocoded);
      if (cfg.baseAddress) {
        const base = await provider.geocode(cfg.baseAddress).catch(() => null);
        if (base) {
          baseIdx = points.length;
          points.push(base);
        }
      }
      for (const b of booked)
        if (b.point && points.length < 25) {
          indexOf.set(b, points.length);
          points.push(b.point);
        }
      matrix = await provider.matrix(points).catch(() => null);
      routeStatus = matrix ? "optimized" : "provider_error";
    }
  }
  const t = (a: number | null, b: number | null) =>
    a == null || b == null || !matrix ? 0 : (matrix[a]?.[b] ?? 0);

  const pref = PREFERENCES[(input.preference ?? "any") as PreferenceId];
  const candidates: (SlotDTO & { score: number; dayKey: string })[] = [];

  for (let d = 0; d <= cfg.horizonDays; d++) {
    const p = zonedParts(new Date(now.getTime() + d * 86400000), tz);
    if (!cfg.openDays.includes(WEEKDAYS[p.weekday] ?? -1)) continue;
    for (let m = cfg.openMin; m + est.minutes <= cfg.closeMin; m += 30) {
      const start = zonedToUtc(p.y, p.mo, p.d, m, tz).getTime();
      if (start < now.getTime() + LEAD_TIME_HOURS * 3600000) continue;
      const end = start + est.minutes * 60000;
      const blockEnd = end + est.bufferMin * 60000;
      if (booked.some((b) => start < b.blockEnd && blockEnd > b.start)) continue;

      const dayStart = zonedToUtc(p.y, p.mo, p.d, 0, tz).getTime();
      const dayEnd = dayStart + 86400000;
      const day = booked.filter((b) => b.start >= dayStart && b.start < dayEnd);
      const prev = [...day].reverse().find((b) => b.start < start) ?? null;
      const next = day.find((b) => b.start > start) ?? null;

      let added: number | null = null;
      if (routeStatus === "optimized") {
        const pi = prev ? (indexOf.get(prev) ?? null) : baseIdx;
        const ni = next ? (indexOf.get(next) ?? null) : null;
        const prevKnown = prev ? pi != null : true;
        const nextKnown = next ? ni != null : true;
        if (prevKnown && nextKnown) {
          added = Math.max(0, t(pi, 0) + t(0, ni) - (pi != null && ni != null ? t(pi, ni) : 0));
          // Travel from the previous stop must fit inside its buffer + gap.
          if (prev && t(pi, 0) * 60000 > start - prev.blockEnd + est.bufferMin * 60000) continue;
        }
      }

      const inWindow = m >= pref.from && m < pref.to;
      const near = m >= pref.from - 60 && m < pref.to + 60;
      const preferenceMatch = inWindow ? "Perfect match" : near ? "Good" : "Outside preference";
      const prefPenalty = inWindow ? 0 : near ? 10 : 30;
      const impact: SlotDTO["impact"] =
        added == null
          ? "unknown"
          : added <= 8
            ? "low"
            : added <= MAX_ADDED_TRAVEL_MIN
              ? "medium"
              : "high";
      const notOffered = added != null && added > MAX_ADDED_TRAVEL_MIN;
      const score = (added ?? 0) + prefPenalty + d * 0.5;

      let reason: string;
      if (added == null)
        reason = day.length
          ? "Open on the schedule. Travel between stops not measured."
          : "Open day — no other stops booked yet.";
      else if (notOffered)
        reason = `Open, but adds ${added} min of driving — above the ${MAX_ADDED_TRAVEL_MIN} min rule.`;
      else if (prev && next) reason = "Fits between existing stops on the route.";
      else if (prev || next) reason = "Close to another stop the same day.";
      else reason = "Open day — no other stops booked yet.";

      candidates.push({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        blockEnd: new Date(blockEnd).toISOString(),
        dayLabel: fmtDay(new Date(start), tz),
        dateLabel: fmtDate(new Date(start), tz),
        timeLabel: fmtTime(new Date(start), tz),
        finishLabel: fmtTime(new Date(end), tz),
        addedTravelMin: added,
        prevArea: prev ? prev.area : null,
        nextArea: next ? next.area : null,
        preferenceMatch,
        impact,
        tag: "",
        reason,
        notOffered,
        score,
        dayKey: `${p.y}-${p.mo}-${p.d}`,
      });
    }
  }

  // Best offered candidate per day, then the top three overall.
  const bestPerDay = new Map<string, (typeof candidates)[number]>();
  for (const c of candidates) {
    if (c.notOffered) continue;
    const cur = bestPerDay.get(c.dayKey);
    if (!cur || c.score < cur.score) bestPerDay.set(c.dayKey, c);
  }
  const offered = [...bestPerDay.values()].sort((a, b) => a.score - b.score).slice(0, 3);
  offered.forEach((s, i) => {
    s.tag =
      routeStatus === "optimized"
        ? i === 0
          ? "Best route fit"
          : "Good fit"
        : i === 0
          ? "Best time match"
          : "Available";
  });
  // One protected example: an open time inside the preferred window that breaks the travel rule.
  const rejected = candidates
    .filter((c) => c.notOffered && c.preferenceMatch === "Perfect match")
    .sort((a, b) => a.score - b.score)[0];
  if (rejected) rejected.tag = "Open, but not recommended";

  const strip = ({ score: _s, dayKey: _d, ...rest }: (typeof candidates)[number]): SlotDTO => rest;
  return {
    outOfArea: false,
    postalCode: postal,
    routeStatus,
    geocoded,
    sameDayStops: booked.length > 0,
    minutes: est.minutes,
    bufferMin: est.bufferMin,
    slots: [...offered.map(strip), ...(rejected ? [strip(rejected)] : [])],
  };
}