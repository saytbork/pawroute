import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/pawroute/brand";
import { getPublicConfig } from "@/lib/booking.functions";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "PawRoute — Privacy" }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const cfg = useServerFn(getPublicConfig);
  const [c, setC] = useState<Awaited<ReturnType<typeof getPublicConfig>> | null>(null);
  useEffect(() => {
    cfg().then(setC);
  }, [cfg]);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="home" />
      <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Privacy</h1>
        <div className="panel mt-5 space-y-4 text-sm leading-relaxed">
          <p>
            PawRoute stores only what is needed to book a grooming visit: your name, email, phone
            (if you provide it), the dog's details, the service address and your booking history.
          </p>
          <p>
            Booking requests are used to schedule visits and are visible only to the business owner.
            Your booking has a private link — anyone with that link can view, reschedule or cancel
            it, so keep it private.
          </p>
          <p>
            We don't sell your data, run advertising, or add tracking beyond basic error reporting.
            Confirmation and reminder emails are sent only for your own bookings.
          </p>
          <p>To have your data removed, contact {c?.privacyEmail ?? "the business owner"}.</p>
        </div>
      </main>
    </div>
  );
}