import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CarFront,
  CheckCircle2,
  Clock,
  Gauge,
  MapPin,
  Navigation,
  Route as RouteIcon,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { DemoBanner, SiteHeader } from "@/components/pawroute/brand";
import { DemoGate } from "@/components/pawroute/demo-gate";
import { getPublicConfig } from "@/lib/booking.functions";
import { exceptions, todaysRoute, type Exception } from "@/lib/pawroute-data";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "PawRoute — Owner dashboard" },
      {
        name: "description",
        content:
          "Maya's PawRoute dashboard: what was automated today, the exceptions that need a decision, and the optimised route for the van.",
      },
      { property: "og:title", content: "PawRoute — Owner dashboard" },
      {
        property: "og:description",
        content:
          "See only the exceptions. PawRoute interprets inquiries, quotes, collects deposits and reschedules around the route.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: () => getPublicConfig(),
  component: function Gated() {
    const cfg = Route.useLoaderData();
    return (
      <DemoGate mode={cfg.mode}>
        <OwnerDashboard />
      </DemoGate>
    );
  },
});

function OwnerDashboard() {
  const [open, setOpen] = useState<Exception | null>(null);
  const [resolved, setResolved] = useState<Record<string, string>>({});

  if (open) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader active="owner" />
        <DemoBanner />
        <ExceptionDetail
          exception={open}
          decision={resolved[open.id]}
          onDecide={(d) => setResolved({ ...resolved, [open.id]: d })}
          onBack={() => setOpen(null)}
        />
      </div>
    );
  }

  const openExceptions = exceptions.filter((e) => !resolved[e.id]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="owner" />
      <DemoBanner />
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-20 pt-7 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="label-eyebrow">Saturday, October 4 · Example workflow</p>
            <h1 className="mt-1 text-3xl sm:text-4xl">Good morning, Maya.</h1>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-sage/60 bg-accent/50 px-3 py-1.5 text-xs font-bold text-teal">
            <Gauge className="size-3.5" />
            Running on time
          </span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-lg border border-primary/25 bg-accent/45 p-5 shadow-[var(--shadow-soft)]">
              <p className="font-display text-[1.6rem] leading-tight sm:text-[2rem]">
                Routine bookings run automatically. Maya only handles exceptions.
              </p>
              <p className="mt-1.5 text-sm font-bold text-ink-soft">
                PawRoute handled 18 booking tasks today.{" "}
                <span className="text-teal">
                  {openExceptions.length} need{openExceptions.length === 1 ? "s" : ""} you.
                </span>
              </p>
              <div className="mt-4 border-t border-primary/20 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="label-eyebrow text-teal">Today&apos;s route</p>
                  <span className="rounded border border-amber/60 bg-amber/15 px-2 py-0.5 text-[11px] font-extrabold uppercase text-amber-foreground">
                    Example route comparison
                  </span>
                </div>
                <p className="mt-1.5 font-display text-lg leading-snug">
                  River Heights → Corydon → St. Vital → St. Boniface
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
                  <p className="font-display text-3xl leading-none">
                    <span className="text-ink-soft line-through decoration-1">94 min</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    48 min
                  </p>
                  <p className="text-sm font-bold">
                    Drive time avoided:{" "}
                    <span className="font-display text-2xl text-teal">46 min</span>
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Naive booking order vs PawRoute order, example route.
                </p>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <div className="rounded-lg border-2 border-primary bg-surface p-4 shadow-[var(--shadow-lift)]">
                <p className="label-eyebrow text-teal">New request · inserted automatically</p>
                <p className="mt-1 font-display text-2xl leading-tight">
                  Bailey · St. Vital · 2:30 PM
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  Inserted between existing stops · 90 min · afternoon
                </p>
                <ul className="mt-2.5 grid gap-1 text-sm font-semibold sm:grid-cols-2">
                  {[
                    "+8 min route impact",
                    "No downstream conflict",
                    "Perfect preference match",
                    "Auto-confirmed after deposit",
                  ].map((x) => (
                    <li key={x} className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 shrink-0 text-sage" />
                      {x}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 inline-flex rounded-md bg-primary px-3 py-1.5 text-sm font-extrabold text-primary-foreground">
                  Owner action: none
                </p>
              </div>
              {exceptions[0] && !resolved[exceptions[0].id] ? (
                <button
                  type="button"
                  onClick={() => setOpen(exceptions[0]!)}
                  className="rounded-lg border-2 border-amber/80 bg-amber/12 p-4 text-left transition-colors hover:bg-amber/20"
                >
                  <p className="label-eyebrow flex items-center gap-1.5 text-amber-foreground">
                    <TriangleAlert className="size-3.5" />
                    Exception
                  </p>
                  <p className="mt-1 font-display text-xl leading-tight">Potential bite history</p>
                  <p className="mt-0.5 text-sm text-ink-soft">Rocco · Border Collie</p>
                  <p className="mt-3 text-sm font-extrabold text-amber-foreground">
                    Needs Maya&apos;s judgment
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-foreground">
                    Review <ArrowRight className="size-3.5" />
                  </p>
                </button>
              ) : (
                <div className="rounded-lg border border-border bg-surface p-4 text-sm font-semibold">
                  Bite history reviewed.
                </div>
              )}
            </section>

            <section className="rounded-lg border border-dashed border-amber/70 bg-amber/8 p-4">
              <p className="label-eyebrow flex items-center gap-1.5 text-amber-foreground">
                <ShieldCheck className="size-3.5" />
                Schedule protected
              </p>
              <p className="mt-1.5 text-sm font-bold">4:30 PM is available, but not offered.</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                {["+31 min travel", "Backtracking", "Risk of delaying Coco"].map((x) => (
                  <li key={x} className="flex items-center gap-1.5">
                    <XCircle className="size-3.5 text-amber-foreground" />
                    {x}
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid divide-y divide-border rounded-lg border border-border bg-surface px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="py-3 sm:pr-5">
                <p className="label-eyebrow">Before</p>
                <p className="mt-1 text-sm font-bold">Customer asks for an afternoon slot</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  Owner checks calendar + duration + location + route + price + deposit +
                  confirmation
                </p>
              </div>
              <div className="py-3 sm:pl-5">
                <p className="label-eyebrow text-teal">PawRoute</p>
                <p className="mt-1 text-sm font-bold">One request · one recommended slot</p>
                <p className="mt-1 text-xs font-bold text-teal">Owner action: none</p>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-surface p-4">
              <p className="label-eyebrow text-teal">Example workflow</p>
              <div className="mt-3 grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
                {[
                  ["18", "Manual touches avoided"],
                  ["2", "Exceptions requiring judgment"],
                  ["4", "Bookings confirmed"],
                  ["2", "Reschedules handled automatically"],
                ].map(([value, label], index) => (
                  <div
                    key={label}
                    className={`min-w-0 px-3 py-2 first:pl-0 sm:py-0 ${index === 2 ? "pl-0 sm:pl-3" : ""}`}
                  >
                    <p className="font-display text-2xl leading-none">{value}</p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-muted-foreground">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="label-eyebrow">Normal bookings · handled automatically</h2>
              <div className="mt-2.5 grid divide-y divide-border rounded-lg border border-border bg-surface sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <div className="p-4">
                  <p className="text-sm font-bold text-teal">Normal bookings</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Inquiry, quote, route, deposit and confirmation run without Maya.
                  </p>
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-amber-foreground">Exceptions</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Only these reach Maya: bite history, outside service zone, unusually long
                    service, route impact above threshold.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <h2 className="label-eyebrow">Exceptions · need Maya&apos;s judgment</h2>
                <span className="text-xs text-muted-foreground">Exceptions only</span>
              </div>
              <div className="mt-2.5 space-y-3">
                {openExceptions.length === 0 ? (
                  <div className="panel flex items-center gap-3 p-4 text-sm">
                    <CheckCircle2 className="size-5 text-sage" />
                    All clear — every other booking went through on its own.
                  </div>
                ) : null}
                {openExceptions.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setOpen(e)}
                    className="w-full rounded-lg border border-amber/70 bg-amber/12 p-4 text-left transition-colors hover:bg-amber/20"
                  >
                    <div className="flex items-start gap-3">
                      {e.kind === "behavior" ? (
                        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-foreground" />
                      ) : (
                        <MapPin className="mt-0.5 size-4 shrink-0 text-amber-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold">
                          {e.kind === "behavior"
                            ? "Bite history → review"
                            : "Outside service zone → approve travel fee"}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-soft">{e.summary}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {e.dog} · {e.customer}
                        </p>
                      </div>
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {Object.entries(resolved).map(([id, d]) => {
                  const e = exceptions.find((x) => x.id === id)!;
                  return (
                    <div
                      key={id}
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[12px] border border-border bg-surface px-4 py-3 text-sm"
                    >
                      <BadgeCheck className="size-4 text-sage" />
                      <span className="font-bold">{e.title}</span>
                      <span className="text-muted-foreground">— {d}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-5">
            <section className="panel p-5">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <h2 className="label-eyebrow flex items-center gap-1.5">
                  <RouteIcon className="size-3.5" />
                  Today&apos;s route
                </h2>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
                  Route order optimized
                </span>
              </div>

              <ol className="mt-4 space-y-4">
                {todaysRoute.map((s, i, arr) => (
                  <li
                    key={s.time}
                    className={`flex gap-3 ${i < arr.length - 1 ? "route-line" : ""}`}
                  >
                    <span
                      className={`mt-1 grid size-[0.9375rem] shrink-0 place-items-center rounded-full border-2 ${
                        s.status === "done"
                          ? "border-sage bg-sage"
                          : s.status === "next"
                            ? "border-teal bg-background"
                            : "border-border bg-background"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-sm font-bold tabular-nums">{to24Hour(s.time)}</p>
                        <p className="text-sm text-ink-soft">
                          {s.area} — {s.dog}
                        </p>
                        {s.status === "next" ? (
                          <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-teal-foreground">
                            Next
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.service} · {s.drive}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <Metric icon={Navigation} label="Total drive time" value="48 min" />
                <Metric icon={CarFront} label="Drive time avoided" value="46 min (example)" />
                <Metric icon={RouteIcon} label="Route order" value="Optimized" />
                <Metric icon={Gauge} label="Schedule" value="Running on time" />
              </div>
            </section>

            <section className="panel p-5">
              <h2 className="label-eyebrow flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5" />
                Operating constraints
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  ["Max extra travel", "15 min"],
                  ["Same-area clustering", "Prefer"],
                  ["Buffer after anxious dogs", "20 min"],
                  ["Cross-city backtracking", "Avoid"],
                  ["Customer preference", "Respect"],
                ].map(([k, v]) => (
                  <li
                    key={k}
                    className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-ink-soft">{k}</span>
                    <span className="shrink-0 font-bold">{v}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Bookings that break a rule become an exception for Maya.
              </p>
            </section>

            <section className="rounded-[12px] border border-border bg-surface-strong p-5">
              <h2 className="label-eyebrow">Handled without you</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage" />A customer moved
                  Thursday&apos;s bath to Wednesday — route impact +2 min.
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage" />
                  Deposit collected for Coco&apos;s puppy groom ($21.00).
                </li>
                <li className="flex gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage" />
                  Prep reminders sent to Luna, Max and Bailey&apos;s owners.
                </li>
              </ul>
              <Link
                to="/book"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal underline-offset-4 hover:underline"
              >
                See the customer booking flow
                <ArrowRight className="size-3.5" />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function to24Hour(time: string) {
  const match = time.match(/^(\d+):(\d+)\s(AM|PM)$/);
  if (!match) return time;
  const hourValue = Number(match[1]);
  const hours = match[3] === "PM" ? (hourValue % 12) + 12 : hourValue % 12;
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CarFront;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5 text-teal" />
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function ExceptionDetail({
  exception,
  decision,
  onDecide,
  onBack,
}: {
  exception: Exception;
  decision: string | undefined;
  onDecide: (d: string) => void;
  onBack: () => void;
}) {
  const actions =
    exception.kind === "behavior"
      ? [
          { label: "Approve booking", icon: CheckCircle2, done: "Booking approved" },
          {
            label: "Require consultation first",
            icon: CalendarCheck,
            done: "Consultation required",
          },
          { label: "Decline", icon: XCircle, done: "Declined" },
        ]
      : [
          { label: "Approve with $28 travel fee", icon: CheckCircle2, done: "Travel fee approved" },
          { label: "Offer last-stop only", icon: Clock, done: "Offered as last stop" },
          { label: "Decline", icon: XCircle, done: "Declined" },
        ];

  return (
    <main className="mx-auto w-full max-w-[860px] px-4 pb-20 pt-7 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-teal underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-3.5" /> Back to dashboard
      </button>

      <div className="mt-4 rounded-lg border border-amber/70 bg-amber/12 p-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-foreground">
          <AlertTriangle className="size-4" />
          Needs your decision
        </p>
        <h1 className="mt-2 text-3xl">{exception.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {exception.dog} · {exception.customer}
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <section className="panel p-5">
          <p className="label-eyebrow">Customer note</p>
          <blockquote className="mt-2 text-base font-semibold leading-relaxed text-foreground">
            {exception.quote}
          </blockquote>
        </section>
        <section className="rounded-lg border border-amber/70 bg-amber/12 p-5">
          <p className="label-eyebrow text-amber-foreground">System summary</p>
          <p className="mt-2 font-display text-xl leading-snug">{exception.summary}</p>
        </section>
      </div>
      {exception.kind === "behavior" ? (
        <div className="mt-4 rounded-lg border border-amber/70 bg-amber/12 p-4">
          <p className="label-eyebrow text-amber-foreground">Why this needs a human</p>
          <p className="mt-1.5 text-sm font-semibold">
            Handling risk affects safety and should not be auto-approved.
          </p>
        </div>
      ) : null}
      <div className="mt-4 border-y border-border py-4">
        <ul className="space-y-2.5">
          {exception.detail.map((d) => (
            <li key={d} className="flex gap-2.5 text-sm text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      {decision ? (
        <div className="mt-5 flex items-center gap-3 rounded-[12px] border border-sage/60 bg-accent/50 p-5">
          <BadgeCheck className="size-5 text-teal" />
          <div>
            <p className="text-sm font-bold">{decision}</p>
            <p className="text-xs text-ink-soft">
              PawRoute notified the customer and updated the route. Nothing else for you to do.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {actions.map((a, i) => (
            <button
              key={a.label}
              type="button"
              onClick={() => onDecide(a.done)}
              className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-bold ${
                i === 0
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : i === actions.length - 1
                    ? "border border-destructive/40 bg-surface text-destructive hover:bg-destructive/10"
                    : "border border-input bg-surface hover:bg-accent/40"
              }`}
            >
              <a.icon className="size-4" />
              {a.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-5 text-xs font-bold text-teal underline-offset-4 hover:underline"
      >
        Back to dashboard
      </button>
    </main>
  );
}