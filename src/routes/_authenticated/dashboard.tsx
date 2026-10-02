import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { CircleCheck, Lock, TriangleAlert } from "lucide-react";
import { SiteHeader } from "@/components/pawroute/brand";
import { getOwnerOverview, ownerCancelBooking, resolveException } from "@/lib/owner.functions";
import { money } from "@/lib/booking-rules";
import { fmtDay, fmtDate, fmtTime, fmtFull } from "@/lib/zoned-time";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "PawRoute — Owner dashboard" }] }),
  component: Dashboard,
});

type Overview = Awaited<ReturnType<typeof getOwnerOverview>>;
type Booking = {
  id: string;
  status: string;
  customer_name: string;
  email: string;
  phone: string | null;
  dog_name: string;
  breed: string | null;
  service: string;
  behavior_notes: string | null;
  original_message: string | null;
  address: string | null;
  postal_code: string | null;
  preferred_window: string | null;
  scheduled_start: string | null;
  duration_min: number;
  estimated_price: number | null;
  route_status: string;
  route_metadata: Record<string, unknown>;
  needs_review: boolean;
  review_reasons: string[];
  review_resolved_at: string | null;
  review_decision: string | null;
  reschedule_count: number;
};
type ExceptionRow = Booking;
type EventRow = {
  id: string;
  booking_id: string | null;
  kind: string;
  message: string;
  created_at: string;
};

function Dashboard() {
  const overview = useServerFn(getOwnerOverview);
  const resolve = useServerFn(resolveException);
  const cancel = useServerFn(ownerCancelBooking);
  const navigate = useNavigate();
  const router = useRouter();
  const [data, setData] = useState<Overview | null | undefined>(undefined);
  const [openException, setOpenException] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    overview()
      .then(setData)
      .catch(() => setData(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => setData(await overview());

  if (data === undefined)
    return (
      <Frame>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Frame>
    );
  if (data === null)
    return (
      <Frame>
        <p className="font-display text-2xl font-semibold">
          Could not load the dashboard. Sign in again.
        </p>
      </Frame>
    );

  if (data.access === "claimable") {
    return (
      <Frame>
        <div className="panel max-w-xl">
          <h1 className="font-display text-2xl font-semibold">Claim the owner seat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is the first sign-in. Claiming makes this account the only owner — later accounts
            can't get owner access.
          </p>
          <button
            onClick={async () => {
              setBusy(true);
              const { supabase } = await import("@/integrations/supabase/client");
              await supabase.rpc("claim_first_owner");
              await refresh();
              setBusy(false);
            }}
            disabled={busy}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            <Lock className="size-4" /> Claim owner access
          </button>
        </div>
      </Frame>
    );
  }
  if (data.access === "denied") {
    return (
      <Frame>
        <div className="panel max-w-xl">
          <h1 className="font-display text-2xl font-semibold">Owner access is taken</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account doesn't have owner access. Sign in as the owner, or sign out and use the
            owner's account.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </button>
            <button
              onClick={async () => {
                await (await import("@/integrations/supabase/client")).supabase.auth.signOut();
                router.invalidate();
              }}
              className="inline-flex h-10 items-center rounded-[10px] border border-border px-4 text-sm font-bold hover:bg-accent"
            >
              Sign out
            </button>
          </div>
        </div>
      </Frame>
    );
  }

  const tz = data.config.timezone;
  const now = new Date();
  const today = (data.bookings as Booking[]).filter(
    (b) => b.scheduled_start && fmtDate(b.scheduled_start, tz) === fmtDate(now, tz),
  );
  const upcoming = (data.bookings as Booking[]).filter(
    (b) => b.scheduled_start && new Date(b.scheduled_start) > now,
  );
  const exceptions = data.exceptions as ExceptionRow[];

  return (
    <Frame>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-eyebrow">Owner dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Good day, {data.config.ownerName}.
          </h1>
        </div>
        <button
          onClick={async () => {
            await (await import("@/integrations/supabase/client")).supabase.auth.signOut();
            router.invalidate();
          }}
          className="text-sm font-semibold text-muted-foreground underline underline-offset-4"
        >
          Sign out
        </button>
      </div>

      {data.config.setupIncomplete && (
        <div className="mt-4 rounded-lg border border-amber/60 bg-amber/10 p-4">
          <div className="flex items-center gap-2 font-bold text-amber-foreground">
            <TriangleAlert className="size-4" /> Setup incomplete
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-foreground">
            {data.config.setupWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="panel">
          <p className="label-eyebrow">Today's route · {fmtDate(now, tz)}</p>
          {today.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No visits scheduled today.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {today.map((b, i) => (
                <li key={b.id} className="flex items-start gap-3">
                  <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-bold">
                      {fmtTime(b.scheduled_start!, tz)} · {b.dog_name}{" "}
                      <span className="font-normal text-muted-foreground">· {b.postal_code}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {b.service} · {b.duration_min} min · {b.customer_name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <p className="label-eyebrow">Upcoming bookings</p>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing booked yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {upcoming.slice(0, 6).map((b) => (
                <li key={b.id} className="py-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{fmtFull(b.scheduled_start!, tz)}</p>
                    <span className="text-xs text-muted-foreground">
                      {b.status === "pending_review" ? "Held for review" : "Confirmed"}
                    </span>
                  </div>
                  <p className="mt-0.5">
                    {b.dog_name} · {b.service} · {money(Number(b.estimated_price ?? 0))} est.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.customer_name} · {b.email}
                    {b.phone ? ` · ${b.phone}` : ""} · {b.address}, {b.postal_code}
                  </p>
                  <button
                    onClick={async () => {
                      setBusy(true);
                      await cancel({ data: { id: b.id } });
                      await refresh();
                      setBusy(false);
                    }}
                    disabled={busy}
                    className="mt-1 text-xs font-semibold text-amber-foreground underline underline-offset-4"
                  >
                    Cancel booking
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel mt-4">
        <p className="label-eyebrow">Exceptions · need your judgment</p>
        {exceptions.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheck className="size-4 text-teal" /> Nothing needs you right now.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {exceptions.map((ex) => {
              const open = openException === ex.id;
              const resolved = ex.review_resolved_at != null;
              return (
                <li key={ex.id} className="rounded-lg border border-border bg-surface-strong p-4">
                  <button
                    onClick={() => setOpenException(open ? null : ex.id)}
                    className="w-full text-left"
                  >
                    <p className="font-bold">
                      {ex.review_reasons[0] ?? "Needs review"} · {ex.dog_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ex.customer_name} · {ex.service}
                      {ex.scheduled_start ? ` · held at ${fmtFull(ex.scheduled_start, tz)}` : ""}
                      {resolved ? ` · decision: ${ex.review_decision}` : ""}
                    </p>
                  </button>
                  {open && (
                    <div className="mt-3 border-t border-border pt-3 text-sm">
                      {ex.behavior_notes && (
                        <p className="mt-1">
                          <strong>Notes:</strong> {ex.behavior_notes}
                        </p>
                      )}
                      {ex.original_message && (
                        <p className="mt-1 italic text-muted-foreground">
                          "{ex.original_message.slice(0, 300)}"
                        </p>
                      )}
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                        {ex.review_reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                      {!resolved && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={async () => {
                              setBusy(true);
                              await resolve({ data: { id: ex.id, decision: "approve" } });
                              await refresh();
                              setBusy(false);
                            }}
                            disabled={busy}
                            className="h-9 rounded-[10px] bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                          >
                            Approve booking
                          </button>
                          <button
                            onClick={async () => {
                              setBusy(true);
                              await resolve({ data: { id: ex.id, decision: "consult" } });
                              await refresh();
                              setBusy(false);
                            }}
                            disabled={busy}
                            className="h-9 rounded-[10px] border border-border px-3 text-xs font-bold hover:bg-accent"
                          >
                            Require consultation first
                          </button>
                          <button
                            onClick={async () => {
                              setBusy(true);
                              await resolve({ data: { id: ex.id, decision: "decline" } });
                              await refresh();
                              setBusy(false);
                            }}
                            disabled={busy}
                            className="h-9 rounded-[10px] border border-amber/60 px-3 text-xs font-bold text-amber-foreground hover:bg-amber/10"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel mt-4">
        <p className="label-eyebrow">Activity</p>
        {(data.events ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {(data.events ?? []).map((e: EventRow) => (
              <li key={e.id} className="flex gap-3">
                <span className="shrink-0 text-xs text-muted-foreground">
                  {fmtDay(e.created_at, tz).slice(0, 3)} {fmtTime(e.created_at, tz)}
                </span>
                <span>{e.message}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="owner" />
      <main className="mx-auto w-full max-w-[1000px] px-4 pb-20 pt-8 sm:px-6">{children}</main>
    </div>
  );
}