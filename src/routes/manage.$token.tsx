import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { SiteHeader } from "@/components/pawroute/brand";
import { SlotCard } from "@/components/pawroute/slot-card";
import {
  cancelBooking,
  getManagedBooking,
  getRescheduleOptions,
  rescheduleBooking,
} from "@/lib/booking.functions";
import type { SlotDTO } from "@/lib/availability.server";
import { money } from "@/lib/booking-rules";

export const Route = createFileRoute("/manage/$token")({
  head: () => ({ meta: [{ title: "PawRoute — Your booking" }] }),
  component: ManagePage,
});

type Managed = NonNullable<Awaited<ReturnType<typeof getManagedBooking>>>;

function ManagePage() {
  const { token } = Route.useParams();
  const [booking, setBooking] = useState<Managed | null | undefined>(undefined);
  const [mode, setMode] = useState<"view" | "reschedule">("view");
  const [options, setOptions] = useState<{ routeStatus: string; slots: SlotDTO[] } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getBooking = useServerFn(getManagedBooking);
  const getOptions = useServerFn(getRescheduleOptions);
  const doReschedule = useServerFn(rescheduleBooking);
  const doCancel = useServerFn(cancelBooking);

  useEffect(() => {
    getBooking({ data: { token } })
      .then((b) => setBooking(b))
      .catch(() => setBooking(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (booking === undefined)
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Shell>
    );
  if (booking === null)
    return (
      <Shell>
        <p className="font-display text-2xl font-semibold">Booking not found.</p>
      </Shell>
    );

  const b = booking;
  const cancelled = b.status === "cancelled" || b.status === "declined";

  const openReschedule = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await getOptions({ data: { token } });
      if (!r)
        setError("No other times are available right now. Contact the groomer to reschedule.");
      else {
        setOptions(r);
        setMode("reschedule");
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmReschedule = async () => {
    if (!picked) return;
    setBusy(true);
    try {
      const r = await doReschedule({ data: { token, start: picked } });
      if (!r.ok) {
        setError(
          r.reason === "conflict"
            ? "Someone just took that time. Please pick another."
            : "This can't be rescheduled online.",
        );
        setPicked(null);
        return;
      }
      setMode("view");
      setNote(
        `Rescheduled. Route impact: ${r.addedTravelMin != null ? `+${r.addedTravelMin} min` : "not measured"}. No owner approval needed.`,
      );
      setBooking(await getBooking({ data: { token } }));
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async () => {
    setBusy(true);
    try {
      const r = await doCancel({ data: { token } });
      if (!r.ok) setError("It's too late to cancel online. Please contact the groomer.");
      else {
        setBooking(await getBooking({ data: { token } }));
        setNote("Booking cancelled.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell>
      <p className="label-eyebrow">{b.businessName}</p>
      {cancelled ? (
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {b.status === "declined" ? "Request declined." : "Booking cancelled."}
        </h1>
      ) : b.status === "pending_review" ? (
        <h1 className="mt-2 font-display text-3xl font-semibold">Request received.</h1>
      ) : (
        <h1 className="mt-2 font-display text-3xl font-semibold">Your booking.</h1>
      )}
      {note && (
        <p className="mt-3 rounded-md border border-teal/40 bg-accent px-3 py-2 text-sm font-semibold">
          {note}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber-foreground">
          {error}
        </p>
      )}

      {!cancelled && (
        <div className="panel mt-5">
          <p className="label-eyebrow">
            {b.status === "pending_review" ? "Held for owner review" : "Confirmed"}
          </p>
          <p className="mt-2 font-display text-xl font-semibold">
            {b.dogName} · {b.service}
          </p>
          {b.start ? (
            <p className="mt-1 text-sm">
              {new Date(b.start).toLocaleString("en-CA", {
                timeZone: b.timezone,
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}{" "}
              · about {b.durationMin} min
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            {b.address}, {b.postalCode}
          </p>
          <div className="mt-3 border-t border-border pt-3 text-sm">
            <p>
              Estimated price: <strong>{money(b.estimatedPrice)}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Deposit required: {money(b.depositRequired)} — not charged online.
            </p>
          </div>
          {b.routeStatus !== "optimized" && (
            <p className="mt-3 text-xs text-muted-foreground">
              Travel time wasn't measured for this visit.
            </p>
          )}
        </div>
      )}

      {mode === "view" && !cancelled && (
        <div className="mt-4 flex flex-wrap gap-3">
          {b.canReschedule && (
            <button
              onClick={openReschedule}
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <CalendarCheck className="size-4" /> Reschedule
            </button>
          )}
          {!cancelled && b.canChange && (
            <button
              onClick={confirmCancel}
              disabled={busy}
              className="inline-flex h-10 items-center rounded-[10px] border border-border px-4 text-sm font-bold hover:bg-accent disabled:opacity-40"
            >
              Cancel
            </button>
          )}
          {!b.canChange && !cancelled && (
            <p className="text-xs text-muted-foreground">
              Changes are possible until {b.cutoffHours} hours before the visit. Contact {b.phone}.
            </p>
          )}
          {b.status === "confirmed" && !b.canReschedule && b.canChange && (
            <p className="text-xs text-muted-foreground">
              No more online reschedules for this visit ({b.maxReschedules} maximum). Contact{" "}
              {b.phone}.
            </p>
          )}
        </div>
      )}

      {mode === "reschedule" && options && (
        <div className="mt-5">
          <h2 className="font-display text-xl font-semibold">Pick a new time</h2>
          {options.routeStatus !== "optimized" && (
            <p className="mt-2 rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber-foreground">
              Travel time isn't measured right now — times are checked against the schedule only.
            </p>
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {options.slots.map((s) => (
              <SlotCard
                key={s.start}
                slot={{
                  id: s.start,
                  day: s.dayLabel,
                  date: s.dateLabel,
                  time: s.timeLabel,
                  finish: s.finishLabel,
                  travelMin: s.addedTravelMin ?? 0,
                  reason: s.reason,
                  ...(s.tag ? { tag: s.tag } : {}),
                  nearby: s.prevArea ? `Previous stop: ${s.prevArea}` : "Van starts fresh",
                  ...(s.addedTravelMin != null ? { travelAdded: `+${s.addedTravelMin} min` } : {}),
                  preferenceMatch: s.preferenceMatch,
                  impact: s.impact,
                  blocked: s.notOffered,
                  ...(s.notOffered ? { whyNot: [s.reason, ""] as [string, string] } : {}),
                }}
                selected={picked === s.start}
                onSelect={() => setPicked(s.start)}
                column
              />
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={confirmReschedule}
              disabled={busy || !picked}
              className="inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              Confirm new time
            </button>
            <button
              onClick={() => {
                setMode("view");
                setPicked(null);
              }}
              className="text-sm font-semibold text-muted-foreground underline underline-offset-4"
            >
              Back
            </button>
          </div>
        </div>
      )}
      <p className="mt-8 text-xs text-muted-foreground">
        <Link to="/" className="underline underline-offset-4">
          PawRoute home
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="customer" />
      <main className="mx-auto w-full max-w-[860px] px-4 pb-20 pt-8 sm:px-6">{children}</main>
    </div>
  );
}