import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getOwnerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { getBusinessConfig, publicConfig } = await import("./config.server");
    const config = publicConfig(getBusinessConfig());
    const { data: isOwner } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isOwner) {
      const { data: taken } = await supabase.rpc("owner_seat_taken");
      return { access: taken ? ("denied" as const) : ("claimable" as const), config };
    }
    const since = new Date(Date.now() - 12 * 3600000).toISOString();
    const [bookings, exceptions, events] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .in("status", ["confirmed", "pending_review"])
        .gte("scheduled_start", since)
        .order("scheduled_start")
        .limit(100),
      supabase
        .from("bookings")
        .select("*")
        .eq("needs_review", true)
        .is("review_resolved_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("booking_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25),
    ]);
    return {
      access: "owner" as const,
      config,
      bookings: bookings.data ?? [],
      exceptions: exceptions.data ?? [],
      events: events.data ?? [],
    };
  });

export const resolveException = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ id: z.string().uuid(), decision: z.enum(["approve", "consult", "decline"]) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isOwner } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isOwner) throw new Error("Forbidden");
    const { data: b } = await supabase
      .from("bookings")
      .select("id,status,dog_name")
      .eq("id", data.id)
      .single();
    if (!b) throw new Error("Not found");
    const patch: { review_decision: string; review_resolved_at?: string; status?: string } = {
      review_decision: data.decision,
    };
    if (data.decision === "approve") {
      patch.review_resolved_at = new Date().toISOString();
      if (b.status === "pending_review") patch.status = "confirmed";
    } else if (data.decision === "decline") {
      patch.review_resolved_at = new Date().toISOString();
      patch.status = "declined";
    }
    // "consult" keeps the exception open and the slot held.
    const { error } = await supabase.from("bookings").update(patch).eq("id", data.id);
    if (error) throw new Error("Could not update");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const label = {
      approve: "approved",
      consult: "marked as needing a consultation first",
      decline: "declined",
    }[data.decision];
    await supabaseAdmin.from("booking_events").insert({
      booking_id: data.id,
      kind: `owner_${data.decision}`,
      message: `Owner ${label}: ${b.dog_name}.`,
    });
    return { ok: true };
  });

export const ownerCancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isOwner } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isOwner) throw new Error("Forbidden");
    const { data: b, error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .select("dog_name")
      .single();
    if (error || !b) throw new Error("Could not cancel");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("booking_events").insert({
      booking_id: data.id,
      kind: "owner_cancelled",
      message: `Owner cancelled ${b.dog_name}.`,
    });
    return { ok: true };
  });