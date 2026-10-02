import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

// Idempotent reminder sender. Call hourly with header `x-cron-secret: <CRON_SECRET>`.
// Each booking is claimed atomically (reminder_status NULL -> 'sending') so no duplicate sends.
export const Route = createFileRoute("/api/public/cron/reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["CRON_SECRET"] ?? process.env["LOVABLE_CRON_SECRET"];
        const given = request.headers.get("x-cron-secret") ?? "";
        if (
          !secret ||
          given.length !== secret.length ||
          !timingSafeEqual(Buffer.from(given), Buffer.from(secret))
        ) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getBusinessConfig } = await import("@/lib/config.server");
        const { sendEmail } = await import("@/lib/email.server");
        const { fmtFull } = await import("@/lib/zoned-time");
        const cfg = getBusinessConfig();
        const from = new Date(Date.now() + 12 * 3600000).toISOString();
        const to = new Date(Date.now() + 36 * 3600000).toISOString();
        const { data: claimed, error } = await supabaseAdmin
          .from("bookings")
          .update({ reminder_status: "sending" })
          .eq("status", "confirmed")
          .is("reminder_status", null)
          .gte("scheduled_start", from)
          .lt("scheduled_start", to)
          .select("id, email, customer_name, dog_name, scheduled_start, manage_token");
        if (error) return Response.json({ error: "claim failed" }, { status: 500 });
        const results: Record<string, number> = { sent: 0, failed: 0, unconfigured: 0 };
        for (const b of claimed ?? []) {
          const status = await sendEmail(
            b.email,
            `Reminder: ${b.dog_name}'s grooming visit`,
            [
              `Hi ${b.customer_name},`,
              `Reminder: ${b.dog_name}'s visit is ${fmtFull(b.scheduled_start!, cfg.timezone)}.`,
              "Please take a short walk beforehand, avoid feeding right before, and clear space for the van.",
              cfg.businessName,
            ],
            { href: `${cfg.siteUrl}/manage/${b.manage_token}`, label: "Manage your booking" },
          );
          results[status] = (results[status] ?? 0) + 1;
          await supabaseAdmin
            .from("bookings")
            .update({
              reminder_status: status,
              reminder_sent_at: status === "sent" ? new Date().toISOString() : null,
            })
            .eq("id", b.id);
          await supabaseAdmin.from("booking_events").insert({
            booking_id: b.id,
            kind: `reminder_${status}`,
            message: `Reminder for ${b.dog_name}: ${status}.`,
          });
        }
        return Response.json({ processed: claimed?.length ?? 0, ...results });
      },
    },
  },
});