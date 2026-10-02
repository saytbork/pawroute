import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock,
  Dog,
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageSquareQuote,
  PhoneCall,
  Repeat,
  Route as RouteIcon,
  Sparkles,
  Timer,
} from "lucide-react";
import { DemoBanner, SiteHeader } from "@/components/pawroute/brand";
import { DemoGate } from "@/components/pawroute/demo-gate";
import { getPublicConfig } from "@/lib/booking.functions";
import { SlotCard } from "@/components/pawroute/slot-card";
import { scenarios, rescheduleSlots, type Scenario, type Slot } from "@/lib/pawroute-data";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "PawRoute — Customer booking" },
      {
        name: "description",
        content:
          "Tell PawRoute about your dog in plain language. We estimate the visit, check our service area and offer route-aware appointment times with an instant quote.",
      },
      { property: "og:title", content: "PawRoute — Customer booking" },
      {
        property: "og:description",
        content:
          "No forms to decode. Describe your dog and get route-aware appointment times, a quote and instant confirmation.",
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
        <CustomerFlow />
      </DemoGate>
    );
  },
});

type Step = "intake" | "extract" | "slots" | "quote" | "confirmed" | "reschedule";

const stepOrder: Step[] = ["intake", "extract", "slots", "quote", "confirmed"];
const stepLabels: Record<string, string> = {
  intake: "Tell us",
  extract: "Understood",
  slots: "Pick a visit",
  quote: "Quote",
  confirmed: "Confirmed",
};

function CustomerFlow() {
  const [step, setStep] = useState<Step>("intake");
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]!);
  const [text, setText] = useState(scenarios[0]!.inquiry);
  const [thinking, setThinking] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [slot, setSlot] = useState<Slot | null>(null);
  const [paying, setPaying] = useState(false);
  const [rescheduled, setRescheduled] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step !== "intake") topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const total = useMemo(() => scenario.quote.reduce((sum, l) => sum + l.amount, 0), [scenario]);
  const deposit = Math.round(total * 0.25);

  function submit(source?: Scenario) {
    const chosen = source ?? matchScenario(text) ?? scenarios[0]!;
    setScenario(chosen);
    if (!text.trim()) setText(chosen.inquiry);
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setStep("extract");
    }, 1100);
  }

  function restart() {
    setStep("intake");
    setScenario(scenarios[0]!);
    setText(scenarios[0]!.inquiry);
    setAnswers({});
    setSlot(null);
    setRescheduled(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="customer" />
      <DemoBanner />
      <div ref={topRef} />

      {step === "intake" ? (
        <IntakeScreen
          text={text}
          setText={(value) => {
            setText(value);
            const matched = matchScenario(value);
            if (matched) setScenario(matched);
          }}
          scenario={scenario}
          thinking={thinking}
          onSubmit={submit}
          onSample={(s) => {
            setScenario(s);
            setText(s.inquiry);
          }}
        />
      ) : (
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-20 pt-6 sm:px-6">
          <FlowProgress step={step} />
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <section className="min-w-0 lg:col-start-2 lg:row-start-1">
              {step === "extract" ? (
                <ExtractStep
                  scenario={scenario}
                  answers={answers}
                  setAnswers={setAnswers}
                  onNext={() => {
                    if (!slot || !scenario.slots.some((x) => x.id === slot.id)) {
                      setSlot(scenario.slots.find((x) => !x.blocked) ?? null);
                    }
                    setStep("slots");
                  }}
                />
              ) : null}

              {step === "slots" ? (
                <SlotsStep
                  slots={scenario.slots}
                  scenario={scenario}
                  selected={slot}
                  onSelect={setSlot}
                  onNext={() => setStep("quote")}
                />
              ) : null}

              {step === "quote" ? (
                <QuoteStep
                  scenario={scenario}
                  slot={slot}
                  total={total}
                  deposit={deposit}
                  paying={paying}
                  onPay={() => {
                    setPaying(true);
                    setTimeout(() => {
                      setPaying(false);
                      setStep("confirmed");
                    }, 1300);
                  }}
                  onBack={() => setStep("slots")}
                />
              ) : null}

              {step === "confirmed" ? (
                <ConfirmedStep
                  scenario={scenario}
                  slot={slot}
                  answers={answers}
                  deposit={deposit}
                  rescheduled={rescheduled}
                  onReschedule={() => setStep("reschedule")}
                />
              ) : null}

              {step === "reschedule" ? (
                <RescheduleStep
                  scenario={scenario}
                  onCancel={() => setStep("confirmed")}
                  onConfirm={(s) => {
                    setSlot(s);
                    setRescheduled(true);
                    setStep("confirmed");
                  }}
                />
              ) : null}
            </section>

            <ContextRail
              scenario={scenario}
              inquiry={text || scenario.inquiry}
              slot={slot}
              answers={answers}
              onRestart={restart}
            />
          </div>
        </main>
      )}
    </div>
  );
}

function matchScenario(input: string): Scenario | null {
  const t = input.toLowerCase();
  if (!t.trim()) return null;
  if (/(two dogs|both|2 dogs|shih tzu)/.test(t)) return scenarios[3]!;
  if (/(puppy|months old|4-month|first groom)/.test(t)) return scenarios[2]!;
  if (/(senior|arthritis|year-old|12-year|older)/.test(t)) return scenarios[1]!;
  return scenarios[0]!;
}

/* ---------------------------------- screen 1 --------------------------------- */

function IntakeScreen({
  text,
  setText,
  thinking,
  scenario,
  onSubmit,
  onSample,
}: {
  text: string;
  setText: (v: string) => void;
  thinking: boolean;
  scenario: Scenario;
  onSubmit: () => void;
  onSample: (s: Scenario) => void;
}) {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-14 pt-6 sm:px-6 lg:pt-8">
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] lg:gap-10">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-ink-soft">
            <RouteIcon className="size-3.5 text-teal" />
            One van · Winnipeg &amp; surrounding areas
          </span>

          <h1 className="mt-4 max-w-3xl text-[2.35rem] leading-[1.05] sm:text-5xl lg:text-[3.6rem]">
            Tell us about your dog.
            <br />
            We&apos;ll find the right visit.
          </h1>
          <p className="mt-3 max-w-xl border-l-2 border-teal pl-3 font-display text-lg leading-snug text-foreground sm:text-xl">
            PawRoute doesn&apos;t just find an open time. It finds the appointment that best fits
            your day.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs font-bold">
            {["Dog", "service", "duration", "location", "route", "customer preference"].map(
              (x, i) => (
                <span key={x} className="flex items-center gap-1.5">
                  {i > 0 ? <span className="text-muted-foreground">+</span> : null}
                  <span className="rounded-md border border-border bg-surface px-2 py-1">{x}</span>
                </span>
              ),
            )}
          </div>

          <div className="mt-5 rounded-lg border border-primary/30 bg-surface p-4 shadow-[var(--shadow-lift)] sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <label htmlFor="inquiry" className="label-eyebrow">
                Your message to Maya
              </label>
              <p className="text-xs font-bold text-teal">
                Tell us once. PawRoute handles the rest.
              </p>
            </div>
            <textarea
              id="inquiry"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="My golden retriever is around 70 lb, gets nervous with dryers, needs a full groom and nail trim, and afternoons work best. I'm near St. Vital."
              className="mt-2 w-full resize-none rounded-md border border-input bg-background px-4 py-3.5 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/80 focus:border-ring focus:ring-2 focus:ring-ring/25"
            />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => onSubmit()}
                disabled={thinking}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                {thinking ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Reading your message…
                  </>
                ) : (
                  <>
                    Find my best appointment
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Timer className="size-3.5" />
                Usually takes under 60 seconds.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <p className="label-eyebrow">Or try a sample situation</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSample(s)}
                  className="rounded-[10px] border border-border bg-surface px-3 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-sage hover:bg-accent/40 hover:text-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="min-w-0 lg:pt-4">
          <UnderstoodPreview scenario={scenario} />
        </aside>
      </div>
    </main>
  );
}

function UnderstoodPreview({ scenario }: { scenario: Scenario }) {
  const e = scenario.extraction;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-surface-strong px-5 py-4">
        <div className="min-w-0">
          <p className="label-eyebrow">PawRoute understood</p>
          <p className="mt-1 truncate text-sm font-bold">Ready to find a route-fit visit</p>
        </div>
        <BadgeCheck className="size-5 shrink-0 text-teal" />
      </div>
      <dl className="divide-y divide-border px-5">
        <PreviewRow label="Dog" value={e.breed} sub={e.weight.replace("Approx. ", "")} />
        <PreviewRow label="Service" value={e.service} />
        <PreviewRow label="Behavior" value={e.behavior} />
        <PreviewRow label="Area" value={e.location} />
        <PreviewRow label="Preference" value={e.preference} />
        <PreviewRow label="Estimated visit" value={`${e.durationMin} min`} emphasized />
      </dl>
      <div className="border-t border-border bg-accent/35 px-5 py-3 text-xs text-ink-soft">
        6 booking details captured from one message.
      </div>
    </div>
  );
}

function PreviewRow({
  label,
  value,
  sub,
  emphasized,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasized?: boolean;
}) {
  return (
    <div className="grid grid-cols-[100px_minmax(0,1fr)] items-center gap-4 py-3">
      <dt className="text-[11px] font-bold uppercase text-muted-foreground">{label}</dt>
      <dd
        className={`min-w-0 text-right text-sm font-bold ${emphasized ? "text-teal" : "text-foreground"}`}
      >
        {value}
        {sub ? <span className="ml-2 font-medium text-muted-foreground">· {sub}</span> : null}
      </dd>
    </div>
  );
}

/* --------------------------------- shared rail -------------------------------- */

function FlowProgress({ step }: { step: Step }) {
  const activeIndex = step === "reschedule" ? 4 : stepOrder.indexOf(step);
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs font-semibold">
      {stepOrder.map((s, i) => (
        <span key={s} className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
              i <= activeIndex ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
            }`}
          >
            {i < activeIndex ? <CheckCircle2 className="size-3.5" /> : null}
            {stepLabels[s]}
          </span>
          {i < stepOrder.length - 1 ? (
            <span className="h-px w-4 bg-border sm:w-6" aria-hidden="true" />
          ) : null}
        </span>
      ))}
    </div>
  );
}

function ContextRail({
  scenario,
  inquiry,
  slot,
  answers,
  onRestart,
}: {
  scenario: Scenario;
  inquiry: string;
  slot: Slot | null;
  answers: Record<string, string>;
  onRestart: () => void;
}) {
  const e = scenario.extraction;
  return (
    <aside className="min-w-0 space-y-4 lg:col-start-1 lg:row-start-1 lg:sticky lg:top-20 lg:self-start">
      <div className="panel p-4">
        <p className="label-eyebrow flex items-center gap-1.5">
          <MessageSquareQuote className="size-3.5" />
          What you told us
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{inquiry}</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-3 text-xs font-bold text-teal underline-offset-4 hover:underline"
        >
          Start over
        </button>
      </div>

      <div className="panel p-4">
        <p className="label-eyebrow flex items-center gap-1.5">
          <Sparkles className="size-3.5" />
          Understood automatically
        </p>
        <dl className="mt-3 space-y-3">
          <RailRow icon={Dog} label="Dog" value={`${e.breed}`} sub={e.weight} />
          <RailRow icon={ClipboardList} label="Service" value={e.service} />
          <RailRow icon={Heart} label="Behaviour" value={e.behavior} />
          <RailRow icon={MapPin} label="Location" value={answers["address"] || e.location} />
          <RailRow icon={Clock} label="Preference" value={e.preference} />
          <RailRow
            icon={Timer}
            label="Estimated visit"
            value={`${e.durationMin} min`}
            sub="Sized from breed, coat and service — not a default block"
          />
        </dl>
      </div>

      {slot ? (
        <div className="rounded-[12px] border border-primary/30 bg-accent/50 p-4">
          <p className="label-eyebrow">Selected visit</p>
          <p className="mt-1 font-display text-lg">
            {slot.day} · {slot.time}
          </p>
          <p className="text-xs text-ink-soft">
            {slot.travelMin} min travel · finishes {slot.finish}
          </p>
        </div>
      ) : null}
    </aside>
  );
}

function RailRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Dog;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-teal" />
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="text-sm font-semibold">{value}</dd>
        {sub ? <dd className="mt-0.5 text-xs text-muted-foreground">{sub}</dd> : null}
      </div>
    </div>
  );
}

function StepHeader({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb?: string }) {
  return (
    <div>
      <p className="label-eyebrow">{eyebrow}</p>
      <h2 className="mt-1.5 text-2xl sm:text-3xl">{title}</h2>
      {blurb ? <p className="mt-2 max-w-2xl text-sm text-ink-soft">{blurb}</p> : null}
    </div>
  );
}

/* ---------------------------------- screen 2 --------------------------------- */

function ExtractStep({
  scenario,
  answers,
  setAnswers,
  onNext,
}: {
  scenario: Scenario;
  answers: Record<string, string>;
  setAnswers: (v: Record<string, string>) => void;
  onNext: () => void;
}) {
  const e = scenario.extraction;
  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Step 2 · Interpretation"
        title="Here's what we picked up"
        blurb="Check anything that looks off. We only ask for what's genuinely missing."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <FactCard label="Dog" value={e.breed} sub={e.weight} icon={Dog} />
        <FactCard label="Service" value={e.service} icon={ClipboardList} />
        <FactCard label="Behaviour" value={e.behavior} icon={Heart} accent />
        <FactCard label="Location" value={e.location} sub="Inside the service area" icon={MapPin} />
        <FactCard label="Preference" value={e.preference} icon={Clock} />
        <FactCard
          label="Estimated visit"
          value={`${e.durationMin} min`}
          sub="Includes setup, drying and cleanup"
          icon={Timer}
          accent
        />
      </div>

      <div className="panel p-5">
        <p className="text-sm font-bold">Just {scenario.missing.length} things we still need</p>
        <div className="mt-4 space-y-3.5">
          {scenario.missing.map((m) => (
            <div key={m.id}>
              <label
                htmlFor={m.id}
                className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                {m.question}
              </label>
              <input
                id={m.id}
                value={answers[m.id] ?? ""}
                onChange={(ev) => setAnswers({ ...answers, [m.id]: ev.target.value })}
                placeholder={m.placeholder}
                className="mt-1.5 h-11 w-full rounded-[10px] border border-input bg-background px-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/25"
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Optional — Maya can confirm details on arrival. Nothing here is a required form field.
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90 sm:w-auto"
      >
        Show route-aware times
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function FactCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Dog;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border p-4 ${
        accent ? "border-sage/60 bg-accent/40" : "border-border bg-surface"
      }`}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5 text-teal" />
        {label}
      </p>
      <p className="mt-1.5 font-display text-lg leading-snug">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

/* ---------------------------------- screen 3 --------------------------------- */

function SlotsStep({
  slots,
  scenario,
  selected,
  onSelect,
  onNext,
}: {
  slots: Slot[];
  scenario: Scenario;
  selected: Slot | null;
  onSelect: (s: Slot) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <StepHeader
        eyebrow="Step 3 · Route-aware availability"
        title="Open time ≠ good time."
        blurb="PawRoute ranks appointments by route impact, service duration and customer preference."
      />

      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-strong px-4 py-2.5 text-xs text-ink-soft">
        <RouteIcon className="size-4 text-teal" />
        <span>
          <strong className="text-foreground">
            {slots.length} open times evaluated against the existing route.
          </strong>{" "}
          {slots.filter((x) => x.blocked).length > 0
            ? `${slots.filter((x) => x.blocked).length} rejected. 1 recommended.`
            : "1 recommended."}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {slots.map((s) => (
          <SlotCard
            column
            key={s.id}
            slot={s}
            selected={selected?.id === s.id}
            onSelect={() => onSelect(s)}
          />
        ))}
      </div>

      {selected ? (
        <RouteImpact key={selected.id} slot={selected} dog={scenario.extraction.dogName} />
      ) : null}

      <button
        type="button"
        onClick={onNext}
        disabled={!selected}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-45 sm:w-auto"
      >
        Continue to quote
        <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

function RouteImpact({ slot, dog }: { slot: Slot; dog: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 rounded-lg border border-border bg-surface-strong p-4 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label-eyebrow text-teal">
          Route impact · {slot.day.slice(0, 3)} {slot.time}
        </p>
        <span className="text-[10px] font-semibold uppercase text-muted-foreground">
          Example route
        </span>
      </div>
      {slot.strip ? (
        <ol className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-stretch sm:gap-0">
          {slot.strip.map((stop, i) => (
            <li
              key={stop.area}
              className="flex flex-col gap-1 sm:flex-1 sm:flex-row sm:items-center sm:gap-0"
            >
              {i > 0 ? (
                <span className="flex items-center gap-2 pl-4 text-xs font-bold text-teal sm:w-20 sm:shrink-0 sm:flex-col sm:gap-0.5 sm:pl-0">
                  <span className="h-4 w-px bg-teal sm:h-px sm:w-full" aria-hidden="true" />
                  {stop.driveIn}
                </span>
              ) : null}
              <span
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  stop.isNew
                    ? "animate-in zoom-in-95 border-2 border-primary bg-accent/70 duration-500"
                    : "border-border bg-surface"
                }`}
              >
                <span className="block text-[11px] font-bold uppercase text-muted-foreground">
                  {stop.area}
                </span>
                <span className="font-bold tabular-nums">{stop.time}</span> {stop.dog}
                {stop.isNew ? (
                  <span className="ml-1.5 text-[10px] font-extrabold uppercase text-teal">New</span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-3 text-sm font-bold">
        Booking {dog} here adds only {slot.travelMin} minutes to today&apos;s route.
      </p>
    </div>
  );
}

/* ---------------------------------- screen 4 --------------------------------- */

function QuoteStep({
  scenario,
  slot,
  total,
  deposit,
  paying,
  onPay,
  onBack,
}: {
  scenario: Scenario;
  slot: Slot | null;
  total: number;
  deposit: number;
  paying: boolean;
  onPay: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Step 4 · Quote"
        title="Your quote, priced from the real visit"
        blurb="Built from your dog's size, coat and behaviour needs — not a guess over text."
      />

      <div className="panel overflow-hidden">
        <div className="divide-y divide-border">
          {scenario.quote.map((l) => (
            <div
              key={l.line}
              className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold">{l.line}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{l.detail}</p>
              </div>
              <p className="shrink-0 text-sm font-bold tabular-nums">
                {l.amount === 0
                  ? "Included"
                  : `${l.amount < 0 ? "−" : ""}$${Math.abs(l.amount).toFixed(2)}`}
              </p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 bg-surface-strong px-4 py-4 sm:px-5">
          <PriceTotal label="Total" value={`$${total.toFixed(2)}`} />
          <PriceTotal label="25% deposit" value={`$${deposit.toFixed(2)}`} emphasized />
          <PriceTotal label="After visit" value={`$${(total - deposit).toFixed(2)}`} />
        </div>
      </div>

      {slot ? (
        <div className="rounded-[12px] border border-border bg-surface p-4 text-sm">
          <p className="font-bold">
            {slot.day}, {slot.date} · {slot.time} – {slot.finish}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {scenario.extraction.durationMin} min visit · {slot.travelMin} min travel from
            Maya&apos;s previous stop
          </p>
        </div>
      ) : null}

      <div className="rounded-lg border border-sage/60 bg-accent/35 p-4 sm:p-5">
        <p className="label-eyebrow text-teal">PawRoute has already handled</p>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold sm:grid-cols-3">
          {["Service", "Duration", "Service zone", "Route fit", "Best slot", "Quote"].map(
            (item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 shrink-0 text-sage" />
                {item}
              </li>
            ),
          )}
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onPay}
          disabled={paying}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-70"
        >
          {paying ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Processing deposit…
            </>
          ) : (
            <>
              <Lock className="size-4" /> Confirm with deposit
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-input bg-surface px-5 text-sm font-bold hover:bg-accent/40"
        >
          Pick another time
        </button>
      </div>
      <p className="inline-flex w-fit items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
        <span className="size-1.5 rounded-full bg-amber" /> Early access · no card is charged
      </p>
    </div>
  );
}

function PriceTotal({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p>
      <p
        className={`mt-1 font-display text-xl sm:text-2xl ${emphasized ? "text-teal" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">CAD</p>
    </div>
  );
}

/* ---------------------------------- screen 5 --------------------------------- */

function ConfirmedStep({
  scenario,
  slot,
  answers,
  deposit,
  rescheduled,
  onReschedule,
}: {
  scenario: Scenario;
  slot: Slot | null;
  answers: Record<string, string>;
  deposit: number;
  rescheduled: boolean;
  onReschedule: () => void;
}) {
  const e = scenario.extraction;
  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-sage/60 bg-accent/50 p-5 sm:p-6">
        <p className="flex items-center gap-2 text-sm font-bold text-teal">
          <BadgeCheck className="size-4" />
          {rescheduled ? "Rescheduled automatically." : "Deposit received"}
        </p>
        <h2 className="mt-2 text-3xl sm:text-4xl">You&apos;re booked.</h2>
        <p className="mt-2 max-w-2xl text-base font-bold text-foreground">
          Placed where it fits best in today&apos;s route.
        </p>
        {rescheduled ? (
          <p className="mt-1 text-sm font-bold text-teal">No owner approval needed.</p>
        ) : null}
        {rescheduled ? (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-sage/50 pt-3 text-xs">
            <p>
              <span className="font-bold text-foreground">Route impact</span>
              <br />
              {slot?.routeDelta ?? "+2 min"}
            </p>
            <p>
              <span className="font-bold text-foreground">Status</span>
              <br />
              Still route-compatible
            </p>
          </div>
        ) : null}
        <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-sage/50 pt-3 text-xs font-semibold">
          {["Route checked", "Quote created", "Deposit recorded", "Confirmation sent"].map(
            (item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 shrink-0 text-sage" />
                {item}
              </span>
            ),
          )}
        </p>
        <Link
          to="/owner"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-[10px] border border-primary/40 bg-surface px-4 text-sm font-bold hover:bg-accent/40"
        >
          See what Maya sees <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="panel divide-y divide-border">
        <Detail label="Dog" value={`${e.dogName} · ${e.breed}`} />
        <Detail
          label="Date & time"
          value={slot ? `${slot.day}, ${slot.date} · ${slot.time}` : "—"}
        />
        <Detail
          label="Arrival window"
          value={slot ? `${slot.time} – ${addMinutes(slot.time, 20)}` : "—"}
          sub="Maya texts when she's 15 minutes out"
        />
        <Detail label="Address" value={answers["address"] || `${e.location}, Winnipeg MB`} />
        <Detail label="Service" value={e.service} />
        <Detail label="Estimated duration" value={`${e.durationMin} min`} />
        <Detail
          label="Deposit paid"
          value={`$${deposit.toFixed(2)} CAD`}
          sub="Balance due after the groom"
        />
      </div>

      <div className="panel p-5">
        <p className="label-eyebrow">Prep instructions for {e.dogName}</p>
        <ul className="mt-3 space-y-2.5">
          {scenario.prep.map((p) => (
            <li key={p} className="flex gap-2.5 text-sm text-ink-soft">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          <CalendarPlus className="size-4" /> Add to calendar
        </button>
        <button
          type="button"
          onClick={onReschedule}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-input bg-surface px-5 text-sm font-bold hover:bg-accent/40"
        >
          <Repeat className="size-4" /> Reschedule
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-input bg-surface px-5 text-sm font-bold hover:bg-accent/40"
        >
          <PhoneCall className="size-4" /> Contact groomer
        </button>
      </div>
    </div>
  );
}

function Detail({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 py-3.5 sm:px-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="text-right">
        <p className="text-sm font-bold">{value}</p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

function addMinutes(time: string, mins: number) {
  const m = time.match(/^(\d+):(\d+)\s?(AM|PM)$/i);
  if (!m) return time;
  let h = Number(m[1]!) % 12;
  if (m[3]!.toUpperCase() === "PM") h += 12;
  const d = new Date(2026, 0, 1, h, Number(m[2]!) + mins);
  const hr = d.getHours();
  const suffix = hr >= 12 ? "PM" : "AM";
  return `${((hr + 11) % 12) + 1}:${String(d.getMinutes()).padStart(2, "0")} ${suffix}`;
}

/* -------------------------------- reschedule -------------------------------- */

function RescheduleStep({
  scenario,
  onCancel,
  onConfirm,
}: {
  scenario: Scenario;
  onCancel: () => void;
  onConfirm: (s: Slot) => void;
}) {
  const [picked, setPicked] = useState<Slot | null>(null);
  return (
    <div className="space-y-5">
      <StepHeader
        eyebrow="Self-service rescheduling"
        title="Move your visit — no phone tag"
        blurb={`Only route-compatible times can be self-booked for a ${scenario.extraction.durationMin}-minute visit. No owner approval needed.`}
      />
      <div className="space-y-3">
        {rescheduleSlots.map((s) => (
          <SlotCard
            key={s.id}
            slot={s}
            selected={picked?.id === s.id}
            onSelect={() => setPicked(s)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={!picked}
          onClick={() => picked && onConfirm(picked)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-45"
        >
          Confirm new time instantly
          <ArrowRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center rounded-[10px] border border-input bg-surface px-5 text-sm font-bold hover:bg-accent/40"
        >
          Keep my current time
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Your deposit carries over. Maya&apos;s route and drive times update automatically.
      </p>
    </div>
  );
}