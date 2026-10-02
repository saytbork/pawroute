import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  detectSafetyConcern,
  estimateVisit,
  LONG_SERVICE_MIN,
  MAX_RESCHEDULES,
  normalizePostal,
  RESCHEDULE_CUTOFF_HOURS,
  SERVICES,
  PREFERENCES,
} from "./booking-rules";

const detailsSchema = z.object({
  dogName: z.string().trim().min(1).max(40),
  breed: z.string().trim().max(60),
  weightLb: z.number().int().min(1).max(250).nullable(),
  service: z.enum(Object.keys(SERVICES) as [keyof typeof SERVICES, ...(keyof typeof SERVICES)[]]),
  nails: z.boolean(),
  anxious: z.boolean(),
  behaviorNotes: z.string().trim().max(500),
  postalCode: z.string().trim().max(10),
  preference: z.enum(
    Object.keys(PREFERENCES) as [keyof typeof PREFERENCES, ...(keyof typeof PREFERENCES)[]],
  ),
});
const contactSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().default(""),
  address: z.string().trim().min(3).max(160),
});

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}
async function cfg() {
  return (await import("./config.server")).getBusinessConfig();
}
async function logEvent(bookingId: string | null, kind: string, message: string) {
  const sb = await admin();
  await sb.from("booking_events").insert({ booking_id: bookingId, kind, message });
}

export const getPublicConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { getBusinessConfig, publicConfig } = await import("./config.server");
  return publicConfig(getBusinessConfig());
});

export const checkAvailability = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ details: detailsSchema, address: z.string().trim().min(3).max(160) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { computeAvailability } = await import("./availability.server");
    const c = await cfg();
    const r = await computeAvailability(c, {
      ...data.details,
      address: data.address,
      postalCode: data.details.postalCode,
    });
    if (r.outOfArea) return r;
    const { geocoded: _g, ...safe } = r;
    return safe;
  });

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        details: detailsSchema,
        contact: contactSchema,
        message: z.string().max(2000),
        start: z.string().datetime(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { computeAvailability } = await import("./availability.server");
    const c = await cfg();
    const { details, contact } = data;
    const avail = await computeAvailability(c, {
      ...details,
      address: contact.address,
      postalCode: details.postalCode,
    });
    if (avail.outOfArea) return { ok: false as const, reason: "out_of_area" as const };
    const slot = avail.slots.find((s) => s.start === data.start && !s.notOffered);
    if (!slot) return { ok: false as const, reason: "conflict" as const };

    const est = estimateVisit(details);
    const reasons: string[] = [];
    if (detectSafetyConcern(`${details.behaviorNotes} ${data.message}`))
      reasons.push("Possible bite or aggression history");
    if (est.minutes > LONG_SERVICE_MIN) reasons.push(`Unusually long visit (${est.minutes} min)`);
    if (avail.routeStatus === "geocode_failed" || avail.routeStatus === "provider_error")
      reasons.push("Route data unavailable for this address");
    const status = reasons.length ? "pending_review" : "confirmed";

    const sb = await admin();
    const { data: row, error } = await sb
      .from("bookings")
      .insert({
        status,
        customer_name: contact.name,
        email: contact.email,
        phone: contact.phone || null,
        dog_name: details.dogName,
        breed: details.breed || null,
        weight_lb: details.weightLb,
        service: SERVICES[details.service].label + (details.nails ? " + nail trim" : ""),
        behavior_notes: details.behaviorNotes || null,
        original_message: data.message || null,
        address: contact.address,
        postal_code: avail.postalCode,
        lat: avail.geocoded?.lat ?? null,
        lng: avail.geocoded?.lng ?? null,
        preferred_window: PREFERENCES[details.preference].label,
        scheduled_start: slot.start,
        scheduled_end: slot.end,
        block_end: slot.blockEnd,
        duration_min: est.minutes,
        buffer_min: est.bufferMin,
        estimated_price: est.total,
        deposit_required: est.deposit,
        route_status: avail.routeStatus === "optimized" ? "optimized" : "unavailable",
        route_metadata: {
          provider_status: avail.routeStatus,
          added_travel_min: slot.addedTravelMin,
          prev_area: slot.prevArea,
          next_area: slot.nextArea,
          preference_match: slot.preferenceMatch,
          reason: slot.reason,
        },
        needs_review: reasons.length > 0,
        review_reasons: reasons,
      })
      .select("id, manage_token")
      .single();
    if (error) {
      if (error.code === "23P01") return { ok: false as const, reason: "conflict" as const };
      console.error("Booking insert failed", error);
      throw new Error("Could not save the booking");
    }

    await logEvent(
      row.id,
      status === "confirmed" ? "booking_confirmed" : "review_required",
      status === "confirmed"
        ? `${details.dogName} booked for ${slot.dayLabel} ${slot.timeLabel}.`
        : `${details.dogName} held for ${slot.dayLabel} ${slot.timeLabel} — needs owner review: ${reasons.join(", ")}.`,
    );

    const { sendEmail } = await import("./email.server");
    const link = `${c.siteUrl}/manage/${row.manage_token}`;
    const emailStatus = await sendEmail(
      contact.email,
      status === "confirmed"
        ? `Booked: ${details.dogName}, ${slot.dayLabel} ${slot.timeLabel}`
        : `Request received for ${details.dogName}`,
      status === "confirmed"
        ? [
            `Hi ${contact.name},`,
            `${details.dogName} is booked for ${slot.dayLabel}, ${slot.dateLabel} at ${slot.timeLabel} (about ${est.minutes} min).`,
            `Estimated price $${est.total.toFixed(2)}. A deposit of $${est.deposit.toFixed(2)} is required at confirmation; it has not been charged online.`,
            c.businessName,
          ]
        : [
            `Hi ${contact.name},`,
            `We're holding ${slot.dayLabel} at ${slot.timeLabel} for ${details.dogName}. ${c.ownerName} reviews this request personally before it is confirmed.`,
            c.businessName,
          ],
      { href: link, label: "Manage your booking" },
    );
    await sb.from("bookings").update({ confirmation_email_status: emailStatus }).eq("id", row.id);
    if (emailStatus !== "sent")
      await logEvent(
        row.id,
        "email_" + emailStatus,
        `Confirmation email ${emailStatus === "failed" ? "failed to send" : "not sent — email provider not configured"}.`,
      );

    return { ok: true as const, token: row.manage_token, status, reasons, emailStatus };
  });

export const requestCallback = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        details: detailsSchema,
        contact: contactSchema,
        message: z.string().max(2000),
        consent: z.literal(true),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const est = estimateVisit(data.details);
    const sb = await admin();
    const { data: row, error } = await sb
      .from("bookings")
      .insert({
        status: "callback_requested",
        customer_name: data.contact.name,
        email: data.contact.email,
        phone: data.contact.phone || null,
        contact_consent: true,
        dog_name: data.details.dogName,
        breed: data.details.breed || null,
        weight_lb: data.details.weightLb,
        service: SERVICES[data.details.service].label,
        behavior_notes: data.details.behaviorNotes || null,
        original_message: data.message || null,
        address: data.contact.address,
        postal_code: normalizePostal(data.details.postalCode) ?? data.details.postalCode,
        preferred_window: PREFERENCES[data.details.preference].label,
        duration_min: est.minutes,
        estimated_price: est.total,
        route_status: "not_applicable",
        needs_review: true,
        review_reasons: ["Address outside service zone"],
      })
      .select("id")
      .single();
    if (error) throw new Error("Could not save the request");
    await logEvent(
      row.id,
      "callback_requested",
      `${data.details.dogName}: outside service zone, customer asked for a callback.`,
    );
    return { ok: true };
  });

const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{48}$/) });

async function loadByToken(token: string) {
  const sb = await admin();
  const { data } = await sb.from("bookings").select("*").eq("manage_token", token).maybeSingle();
  return data;
}

export const getManagedBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const b = await loadByToken(data.token);
    if (!b) return null;
    const c = await cfg();
    const hoursUntil = b.scheduled_start
      ? (new Date(b.scheduled_start).getTime() - Date.now()) / 3600000
      : 0;
    return {
      status: b.status,
      dogName: b.dog_name,
      customerName: b.customer_name,
      service: b.service,
      address: b.address,
      postalCode: b.postal_code,
      start: b.scheduled_start,
      durationMin: b.duration_min,
      estimatedPrice: Number(b.estimated_price ?? 0),
      depositRequired: Number(b.deposit_required ?? 0),
      routeStatus: b.route_status,
      rescheduleCount: b.reschedule_count,
      canChange: b.status === "confirmed" && hoursUntil >= RESCHEDULE_CUTOFF_HOURS,
      canReschedule:
        b.status === "confirmed" &&
        hoursUntil >= RESCHEDULE_CUTOFF_HOURS &&
        b.reschedule_count < MAX_RESCHEDULES,
      cutoffHours: RESCHEDULE_CUTOFF_HOURS,
      maxReschedules: MAX_RESCHEDULES,
      timezone: c.timezone,
      phone: c.phone,
      businessName: c.businessName,
    };
  });

function detailsFromRow(b: NonNullable<Awaited<ReturnType<typeof loadByToken>>>) {
  const svc = (Object.entries(SERVICES).find(([, v]) => b.service.startsWith(v.label))?.[0] ??
    "full_groom") as keyof typeof SERVICES;
  const pref = (Object.entries(PREFERENCES).find(([, v]) => v.label === b.preferred_window)?.[0] ??
    "any") as keyof typeof PREFERENCES;
  return {
    service: svc,
    weightLb: b.weight_lb,
    nails: b.service.includes("nail"),
    anxious: /anxious|nervous/i.test(b.behavior_notes ?? ""),
    preference: pref,
  };
}

export const getRescheduleOptions = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const b = await loadByToken(data.token);
    if (!b || b.status !== "confirmed") return null;
    const { computeAvailability } = await import("./availability.server");
    const r = await computeAvailability(await cfg(), {
      ...detailsFromRow(b),
      address: b.address ?? "",
      postalCode: b.postal_code ?? "",
      excludeBookingId: b.id,
    });
    if (r.outOfArea) return null;
    const current = b.scheduled_start ? new Date(b.scheduled_start).toISOString() : "";
    return { routeStatus: r.routeStatus, slots: r.slots.filter((s) => s.start !== current) };
  });

export const rescheduleBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.extend({ start: z.string().datetime() }).parse(d))
  .handler(async ({ data }) => {
    const b = await loadByToken(data.token);
    if (!b || b.status !== "confirmed" || !b.scheduled_start)
      return { ok: false as const, reason: "not_allowed" as const };
    const hours = (new Date(b.scheduled_start).getTime() - Date.now()) / 3600000;
    if (hours < RESCHEDULE_CUTOFF_HOURS || b.reschedule_count >= MAX_RESCHEDULES)
      return { ok: false as const, reason: "not_allowed" as const };
    const { computeAvailability } = await import("./availability.server");
    const r = await computeAvailability(await cfg(), {
      ...detailsFromRow(b),
      address: b.address ?? "",
      postalCode: b.postal_code ?? "",
      excludeBookingId: b.id,
    });
    if (r.outOfArea) return { ok: false as const, reason: "not_allowed" as const };
    const slot = r.slots.find((s) => s.start === data.start && !s.notOffered);
    if (!slot) return { ok: false as const, reason: "conflict" as const };
    const sb = await admin();
    const { error } = await sb
      .from("bookings")
      .update({
        scheduled_start: slot.start,
        scheduled_end: slot.end,
        block_end: slot.blockEnd,
        reschedule_count: b.reschedule_count + 1,
        reminder_status: null,
        route_metadata: {
          ...(b.route_metadata as object),
          added_travel_min: slot.addedTravelMin,
          prev_area: slot.prevArea,
          next_area: slot.nextArea,
          reason: slot.reason,
          provider_status: r.routeStatus,
        },
        route_status: r.routeStatus === "optimized" ? "optimized" : "unavailable",
      })
      .eq("id", b.id)
      .eq("reschedule_count", b.reschedule_count);
    if (error) {
      if (error.code === "23P01") return { ok: false as const, reason: "conflict" as const };
      throw new Error("Could not reschedule");
    }
    await logEvent(
      b.id,
      "rescheduled",
      `${b.dog_name} rescheduled by customer to ${slot.dayLabel} ${slot.timeLabel}.`,
    );
    return { ok: true as const, addedTravelMin: slot.addedTravelMin, routeStatus: r.routeStatus };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    const b = await loadByToken(data.token);
    if (!b || !["confirmed", "pending_review"].includes(b.status) || !b.scheduled_start)
      return { ok: false as const };
    const hours = (new Date(b.scheduled_start).getTime() - Date.now()) / 3600000;
    if (hours < RESCHEDULE_CUTOFF_HOURS) return { ok: false as const };
    const sb = await admin();
    await sb.from("bookings").update({ status: "cancelled" }).eq("id", b.id);
    await logEvent(b.id, "cancelled", `${b.dog_name} cancelled by customer.`);
    return { ok: true as const };
  });