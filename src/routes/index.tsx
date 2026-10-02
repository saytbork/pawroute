import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  MessageSquareQuote,
  Route as RouteIcon,
  ShieldAlert,
  Timer,
  UserRound,
  XCircle,
  Receipt,
  HeartHandshake,
  ScanText,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/pawroute/brand";

const TITLE = "PawRoute — Route-aware booking for mobile dog groomers";
const DESC =
  "PawRoute helps mobile dog groomers turn customer requests into appointments that fit the service, the customer, and the route.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://route-wise-paws.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://route-wise-paws.lovable.app/" }],
  }),
  component: HomePage,
});

const btnPrimary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90";
const btnSecondary =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-border bg-card px-5 text-sm font-bold hover:bg-accent/40";

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-16 border-t border-border/70 ${className}`}>
      <div className="mx-auto w-full max-w-[1280px] px-4 py-14 sm:px-6 lg:py-20">{children}</div>
    </section>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SiteHeader active="home" />
      <main>
        {/* HERO */}
        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-20 lg:pt-16">
          <div className="min-w-0">
            <p className="label-eyebrow text-teal">Route-aware booking for mobile dog groomers</p>
            <h1 className="mt-3 text-4xl leading-[1.05] sm:text-5xl lg:text-[3.5rem]">
              Book more appointments without wrecking your route.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              PawRoute reads each customer request, weighs service length, location and preference
              together, and offers times that fit the van's day. Fewer back-and-forth messages — you
              step in only for exceptions.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/request" className={btnPrimary}>
                Try PawRoute <ArrowRight className="size-4" />
              </Link>
              <Link to="/" hash="how" className={btnSecondary}>
                See how it works
              </Link>
            </div>
          </div>
          <DemoFlowCard />
        </div>

        {/* PROBLEM */}
        <Section id="why">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="label-eyebrow">The problem</p>
              <h2 className="mt-2 text-3xl sm:text-4xl">Open time is not always the right time.</h2>
              <ul className="mt-6 space-y-3 text-sm sm:text-base">
                {[
                  [
                    RouteIcon,
                    "A booking across town can cost you the rest of the afternoon in drive time.",
                  ],
                  [Timer, "A matted doodle and a shih tzu nail trim don't take the same slot."],
                  [UserRound, "Customers still want their mornings or afternoons respected."],
                  [
                    ShieldAlert,
                    "Bite history or unusual requests deserve your call, not an auto-reply.",
                  ],
                ].map(([Icon, t], i) => {
                  const I = Icon as typeof RouteIcon;
                  return (
                    <li key={i} className="flex gap-3">
                      <I className="mt-0.5 size-4 shrink-0 text-teal" />
                      <span>{t as string}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:self-center">
              <div className="panel p-5">
                <p className="label-eyebrow">Generic calendar</p>
                <p className="mt-3 font-display text-2xl">"Is 2:30 PM open?"</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Yes / no. Nothing about the drive.
                </p>
              </div>
              <div className="panel border-primary/50 bg-surface p-5">
                <p className="label-eyebrow text-teal">PawRoute</p>
                <p className="mt-3 font-display text-2xl">
                  "Does 2:30 PM fit the customer and the route?"
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Duration, preference and drive time together.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* HOW */}
        <Section id="how" className="bg-surface-strong/50">
          <p className="label-eyebrow">How it works</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">From request to booked visit in four steps.</h2>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                ScanText,
                "Understand the request",
                "Dog, breed, weight, behavior, area and preference read from a plain message.",
              ],
              [
                Clock,
                "Estimate service + duration",
                "Golden Retriever, full groom + nails, anxious: 90 min.",
              ],
              [
                RouteIcon,
                "Find route-compatible times",
                "Each open time weighed by added drive and preference fit.",
              ],
              [
                Receipt,
                "Quote + confirmation flow",
                "Itemized quote, booking details and prep notes for the customer.",
              ],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof RouteIcon;
              return (
                <li key={i} className="panel p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl text-muted-foreground">0{i + 1}</span>
                    <I className="size-5 text-teal" />
                  </div>
                  <p className="mt-4 font-bold">{t as string}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">{d as string}</p>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 text-sm font-semibold">
            Routine bookings continue automatically. Exceptions go to the owner.
          </p>
        </Section>

        {/* DIFFERENTIATOR */}
        <Section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-eyebrow">Route-aware ranking</p>
              <h2 className="mt-2 text-3xl sm:text-4xl">Not just available. Route-compatible.</h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
                A free slot can still be a bad slot. All three times below are open — PawRoute ranks
                them by travel added, backtracking risk and the customer's afternoon preference.
              </p>
            </div>
            <Link to="/book" className={btnSecondary}>
              See the booking flow <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
            <SlotExample
              tag="Best fit"
              time="Tue 2:30 PM"
              delta="+8 min"
              impact="Low route impact"
              note="Fits between River Heights and St. Boniface. Perfect preference match."
              tone="best"
            />
            <SlotExample
              tag="Good fit"
              time="Thu 3:15 PM"
              delta="+12 min"
              impact="Medium route impact"
              note="Reasonable detour, still in the afternoon window."
              tone="good"
            />
            <SlotExample
              tag="Open, not recommended"
              time="Tue 4:30 PM"
              delta="+31 min"
              impact="High route impact"
              note="Creates backtracking. Risk of making the next stop late."
              tone="bad"
            />
          </div>
        </Section>

        {/* OWNER VALUE */}
        <Section className="bg-surface-strong/50">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="label-eyebrow">Owner value</p>
              <h2 className="mt-2 text-3xl sm:text-4xl">
                Automate the routine. Keep judgment human.
              </h2>
            </div>
            <Link to="/dashboard" className={btnSecondary}>
              View owner dashboard <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <div className="panel border-l-2 border-l-sage p-5">
              <p className="font-bold">Routine steps PawRoute takes on</p>
              <ul className="mt-4 divide-y divide-border text-sm">
                {[
                  "Reading and interpreting inquiries",
                  "Estimating service and visit length",
                  "Matching times to the route",
                  "Preparing quotes and booking details",
                  "Handling route-compatible reschedules",
                ].map((l) => (
                  <li key={l} className="flex items-center gap-2 py-2">
                    <CheckCircle2 className="size-4 text-sage" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel border-l-2 border-l-amber p-5">
              <p className="font-bold">Left to your judgment</p>
              <ul className="mt-4 divide-y divide-border text-sm">
                {["Bite history", "Outside service zone", "Rule-breaking route impact"].map((l) => (
                  <li key={l} className="flex items-center gap-2 py-2">
                    <ShieldAlert className="size-4 text-amber" />
                    {l}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Safety and unusual cases are never auto-approved.
              </p>
            </div>
          </div>
          <div className="mt-3 grid overflow-hidden rounded-[10px] border border-border bg-card text-sm sm:grid-cols-2">
            <div className="p-4">
              <p className="label-eyebrow">Without PawRoute</p>
              <p className="mt-1.5 font-semibold">
                Several messages + route and calendar checking per booking
              </p>
            </div>
            <div className="border-t border-border bg-surface p-4 sm:border-l sm:border-t-0">
              <p className="label-eyebrow text-teal">With PawRoute</p>
              <p className="mt-1.5 font-semibold">One customer request</p>
              <p className="text-muted-foreground">You step in only when an exception comes up</p>
            </div>
          </div>
        </Section>

        {/* PRINCIPLES */}
        <Section>
          <p className="label-eyebrow">What PawRoute stands for</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              [
                HeartHandshake,
                "Customer-first",
                "Preferred times stay part of every recommendation.",
              ],
              [
                RouteIcon,
                "Route-aware",
                "Every booking is weighed against the day already planned.",
              ],
              [
                ShieldAlert,
                "Your call when it matters",
                "Safety and unusual requests always come to you.",
              ],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof RouteIcon;
              return (
                <div key={t as string} className="panel p-5">
                  <I className="size-5 text-teal" />
                  <p className="mt-3 font-bold">{t as string}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{d as string}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* FINAL CTA */}
        <Section>
          <div className="focus-on-dark rounded-[14px] bg-primary px-6 py-10 text-primary-foreground sm:px-10">
            <h2 className="text-3xl sm:text-4xl">Build a better day, one booking at a time.</h2>
            <p className="mt-3 max-w-xl opacity-85">
              See how a single customer request becomes a visit that fits your route.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/request"
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-background px-5 text-sm font-bold text-foreground hover:bg-background/90"
              >
                Try PawRoute <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex h-11 items-center rounded-[10px] border border-primary-foreground/40 px-5 text-sm font-bold hover:bg-primary-foreground/10"
              >
                View owner dashboard
              </Link>
            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section id="faq">
          <p className="label-eyebrow">FAQ</p>
          <dl className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {[
              [
                "Who is PawRoute for?",
                "Mobile dog groomers — usually one van, one owner — who book visits at customers' homes and lose time to messages and driving.",
              ],
              [
                "How is PawRoute different from a normal booking calendar?",
                "A calendar only knows whether a time is free. PawRoute also weighs service length, customer preference and how much driving a booking adds to the day.",
              ],
              [
                "Does PawRoute replace the groomer's judgment?",
                "No. Routine requests move forward on their own; bite history, out-of-zone addresses and unusual route impact are sent to the owner to decide.",
              ],
              [
                "Does PawRoute optimize the whole day automatically?",
                "It places each new booking where it fits the existing route best. This is an early access experience — some operational integrations, like payments and live routing, are still being finalized.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="border-t border-border pt-4">
                <dt className="font-bold">{q}</dt>
                <dd className="mt-1.5 text-sm text-muted-foreground">{a}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function DemoFlowCard() {
  const steps = [
    {
      icon: MessageSquareQuote,
      label: "Customer message",
      value: "\u201CGolden retriever, ~70 lb, nervous with dryers… afternoons, St. Vital.\u201D",
    },
    {
      icon: ScanText,
      label: "6 details captured",
      value: "Dog · Service · Behavior · Area · Preference · 90 min visit",
    },
    { icon: RouteIcon, label: "Best route fit", value: "Tue 2:30 PM", strong: true },
    { icon: Timer, label: "Route impact", value: "+8 min · Low" },
    { icon: Receipt, label: "Quote + deposit", value: "$157.00 · 25% deposit $39.25" },
    {
      icon: CalendarCheck,
      label: "Confirmed",
      value: "Bailey · Tuesday, Oct 7 · 2:30 PM",
      done: true,
    },
  ];
  return (
    <div className="panel min-w-0 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">Booking flow</p>
        <span className="rounded-md border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          Example
        </span>
      </div>
      <ol className="mt-4">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && (
              <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-border" />
            )}
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-full border ${s.done ? "border-primary bg-primary text-primary-foreground" : s.strong ? "border-teal bg-surface text-teal" : "border-border bg-card text-muted-foreground"}`}
            >
              <s.icon className="size-4" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
              <p className={`text-sm ${s.strong ? "font-display text-xl" : "font-semibold"}`}>
                {s.value}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function SlotExample({
  tag,
  time,
  delta,
  impact,
  note,
  tone,
}: {
  tag: string;
  time: string;
  delta: string;
  impact: string;
  note: string;
  tone: "best" | "good" | "bad";
}) {
  const box =
    tone === "best"
      ? "border-2 border-primary bg-surface"
      : tone === "bad"
        ? "border border-dashed border-amber bg-card"
        : "border border-border bg-card";
  return (
    <div className={`rounded-[12px] p-5 ${box}`}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`label-eyebrow ${tone === "bad" ? "text-amber" : tone === "best" ? "text-teal" : ""}`}
        >
          {tag}
        </span>
        {tone === "bad" ? (
          <XCircle className="size-4 text-amber" />
        ) : (
          <CheckCircle2 className={`size-4 ${tone === "best" ? "text-teal" : "text-sage"}`} />
        )}
      </div>
      <p className="mt-3 font-display text-2xl">{time}</p>
      <p
        className={`mt-2 text-3xl font-extrabold tabular-nums ${tone === "bad" ? "text-amber" : ""}`}
      >
        {delta}
      </p>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {impact}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}