import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { CalendarCheck, CircleCheck, TriangleAlert } from "lucide-react";
import { SiteHeader } from "@/components/pawroute/brand";
import { SlotCard } from "@/components/pawroute/slot-card";
import {
  estimateVisit,
  money,
  normalizePostal,
  parseMessage,
  PREFERENCES,
  SERVICES,
  type Details,
  type PreferenceId,
  type ServiceId,
} from "@/lib/booking-rules";
import {
  checkAvailability,
  createBooking,
  getPublicConfig,
  requestCallback,
} from "@/lib/booking.functions";
import type { SlotDTO } from "@/lib/availability.server";
import type { PublicConfig } from "@/lib/config.public";

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "PawRoute — Book a visit" },
      {
        name: "description",
        content:
          "Send one message. PawRoute checks the schedule, travel fit and your preference, then books the visit.",
      },
    ],
  }),
  component: RequestPage,
});

const sample =
  "Hi! Could someone come groom Biscuit? He's a 4-year-old cocker spaniel, about 24 lb, really nervous around dryers. He needs a bath and a tidy plus nails done if possible. Afternoons are best, we're near 123 Maple Ave, R3L 0T5. Thanks!";

type PublicSlot = Omit<SlotDTO, never>;
type Avail =
  | { outOfArea: true; postalCode: string | null }
  | {
      outOfArea: false;
      postalCode: string;
      routeStatus: string;
      minutes: number;
      bufferMin: number;
      slots: PublicSlot[];
    };

function toSlotDto(s: PublicSlot) {
  return {
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
  };
}

function RequestPage() {
  const [step, setStep] = useState<"message" | "details" | "slots" | "done">("message");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<Details | null>(null);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", address: "" });
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [avail, setAvail] = useState<Avail | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    token: string;
    emailStatus: string;
  } | null>(null);
  const [callbackDone, setCallbackDone] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const scrollUp = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const getConfig = useServerFn(getPublicConfig);
  const check = useServerFn(checkAvailability);
  const create = useServerFn(createBooking);
  const callback = useServerFn(requestCallback);

  const useSample = async () => {
    setMessage(sample);
    setConfig(config ?? (await getConfig()));
  };

  const startParse = () => {
    if (!message.trim()) return;
    setDetails(parseMessage(message).details);
    setStep("details");
    scrollUp();
  };

  const doCheck = async () => {
    if (!details || !contact.name || !contact.email || !contact.address) return;
    setBusy(true);
    setConflict(false);
    try {
      if (!config) setConfig(await getConfig());
      const r = await check({ data: { details, address: contact.address } });
      setAvail(r);
      setPicked(null);
      setStep("slots");
      scrollUp();
    } finally {
      setBusy(false);
    }
  };

  const doCreate = async () => {
    if (!details || !picked) return;
    setBusy(true);
    try {
      const r = await create({ data: { details, contact, message, start: picked } });
      if (!r.ok) {
        setConflict(true);
        setPicked(null);
        if (r.reason === "out_of_area") setAvail({ outOfArea: true, postalCode: null });
        return;
      }
      setResult({ status: r.status, token: r.token, emailStatus: r.emailStatus });
      setStep("done");
      scrollUp();
    } finally {
      setBusy(false);
    }
  };

  const doCallback = async () => {
    if (!details || !contact.phone || !consent) return;
    setBusy(true);
    try {
      await callback({ data: { details, contact, message, consent: true } });
      setCallbackDone(true);
      setStep("done");
      scrollUp();
    } finally {
      setBusy(false);
    }
  };

  const est = details ? estimateVisit(details) : null;
  const outOfArea = avail?.outOfArea === true;

  return (
    <div className="min-h-screen bg-background" ref={topRef}>
      <SiteHeader active="customer" />
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-20 pt-8 sm:px-6">
        <p className="label-eyebrow">Book a visit</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Tell us about your dog.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          One message. We check the schedule and travel fit, then book the visit. You confirm the
          details before anything is saved.
        </p>

        <ol className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
          {(["Message", "Details", "Time", "Done"] as const).map((label, i) => {
            const activeIdx = ["message", "details", "slots", "done"].indexOf(step);
            return (
              <li
                key={label}
                className={`rounded-md border px-2.5 py-1 ${i <= activeIdx ? "border-teal/40 bg-accent text-foreground" : "border-border text-muted-foreground"}`}
              >
                {i + 1}. {label}
              </li>
            );
          })}
        </ol>

        {step === "message" && (
          <section className="panel mt-6 max-w-2xl">
            <label htmlFor="msg" className="font-display text-lg font-semibold">
              Your message
            </label>
            <p className="mt-1 text-sm text-muted-foreground">
              Write it however you like — the details get pulled out for you to check.
            </p>
            <textarea
              id="msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="e.g. Hi! My golden retriever Biscuit needs a bath and nails done, he's nervous around dryers. Afternoons work, we're near Maple Ave."
              className="mt-3 w-full rounded-[10px] border border-border bg-surface-strong p-3 text-sm leading-relaxed outline-none focus:border-teal"
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={startParse}
                disabled={!message.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <CalendarCheck className="size-4" /> Continue
              </button>
              <button
                onClick={useSample}
                className="text-sm font-semibold text-teal underline underline-offset-4"
              >
                Use a sample message
              </button>
            </div>
          </section>
        )}

        {step === "details" && details && (
          <section className="mt-6 max-w-3xl">
            <h2 className="font-display text-2xl font-semibold">Check what we picked up</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit anything that's wrong or missing. Nothing is saved yet.
            </p>
            <div className="panel mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Dog's name"
                value={details.dogName}
                onChange={(v) => setDetails({ ...details, dogName: v })}
              />
              <Field
                label="Breed"
                value={details.breed}
                onChange={(v) => setDetails({ ...details, breed: v })}
              />
              <Field
                label="Approx. weight (lb)"
                type="number"
                value={details.weightLb?.toString() ?? ""}
                onChange={(v) => setDetails({ ...details, weightLb: v ? Number(v) : null })}
              />
              <div>
                <Label>Service</Label>
                <select
                  value={details.service ?? ""}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      service: (e.target.value || null) as ServiceId | null,
                    })
                  }
                  className={selectCls}
                >
                  <option value="" disabled>
                    Select a service…
                  </option>
                  {Object.entries(SERVICES).map(([id, s]) => (
                    <option key={id} value={id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Address"
                value={contact.address}
                onChange={(v) => setContact({ ...contact, address: v })}
                placeholder="123 Maple Ave"
              />
              <Field
                label="Postal code"
                value={details.postalCode}
                onChange={(v) => setDetails({ ...details, postalCode: v.toUpperCase() })}
                placeholder="R3L 0T5"
              />
              <div>
                <Label>Preferred time</Label>
                <select
                  value={details.preference ?? ""}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      preference: (e.target.value || null) as PreferenceId | null,
                    })
                  }
                  className={selectCls}
                >
                  <option value="" disabled>
                    Select a preference…
                  </option>
                  {Object.entries(PREFERENCES).map(([id, p]) => (
                    <option key={id} value={id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="Behavior / safety notes"
                value={details.behaviorNotes}
                onChange={(v) => setDetails({ ...details, behaviorNotes: v })}
              />
              <div className="sm:col-span-2 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
                <Field
                  label="Your name"
                  value={contact.name}
                  onChange={(v) => setContact({ ...contact, name: v })}
                />
                <Field
                  label="Email"
                  type="email"
                  value={contact.email}
                  onChange={(v) => setContact({ ...contact, email: v })}
                />
                <Field
                  label="Phone (optional)"
                  type="tel"
                  value={contact.phone}
                  onChange={(v) => setContact({ ...contact, phone: v })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={details.nails}
                  onChange={(e) => setDetails({ ...details, nails: e.target.checked })}
                  className="size-4 accent-[var(--color-teal)]"
                />
                Include a nail trim
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={details.anxious}
                  onChange={(e) => setDetails({ ...details, anxious: e.target.checked })}
                  className="size-4 accent-[var(--color-teal)]"
                />
                Anxious / needs a slower pace
              </label>
            </div>

            {est && details.service && contact.address && (
              <div className="panel mt-4 max-w-2xl">
                <p className="label-eyebrow">Estimated visit</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {est.lines.map((l) => (
                    <li key={l.line} className="flex justify-between">
                      <span>{l.line}</span>
                      <span className="font-semibold">{money(l.amount)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold">
                  <span>Estimated total</span>
                  <span>{money(est.total)}</span>
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  A deposit of {money(est.deposit)} is required to confirm. It is not charged
                  online.
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={doCheck}
                disabled={
                  busy || !details.service || !contact.name || !contact.email || !contact.address
                }
                className="inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                {busy ? "Checking the schedule…" : "Check availability"}
              </button>
              <button
                onClick={() => {
                  setStep("message");
                  scrollUp();
                }}
                className="text-sm font-semibold text-muted-foreground underline underline-offset-4"
              >
                Back
              </button>
            </div>
          </section>
        )}

        {step === "slots" && avail && (
          <section className="mt-6 max-w-3xl">
            {outOfArea ? (
              <div className="panel border-amber/60">
                <div className="flex items-center gap-2 text-amber-foreground">
                  <TriangleAlert className="size-5" />
                  <h2 className="font-display text-xl font-semibold">
                    Outside the regular service area
                  </h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {avail.postalCode ? `Postal code ${avail.postalCode} is` : "This address is"}{" "}
                  outside the areas {config?.businessName ?? "we"} serves. You can leave your number
                  and the owner will call you back — only with your consent below.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Phone"
                    type="tel"
                    value={contact.phone}
                    onChange={(v) => setContact({ ...contact, phone: v })}
                  />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="size-4 accent-[var(--color-teal)]"
                  />
                  Yes, call me back about this request.
                </label>
                <button
                  onClick={doCallback}
                  disabled={busy || !contact.phone || !consent}
                  className="mt-4 inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                >
                  Request a callback
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-semibold">Times that fit the schedule</h2>
                {avail.routeStatus === "optimized" ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ranked by added travel time and your preference.
                  </p>
                ) : (
                  <p className="mt-2 rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber-foreground">
                    Live route optimization is unavailable, so travel time isn't measured. Times
                    below are checked against the existing schedule only.
                  </p>
                )}
                {conflict && (
                  <p className="mt-3 rounded-md border border-amber/60 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber-foreground">
                    Someone just took that time. Please pick another.
                  </p>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {avail.slots.map((s) => {
                    const dto = toSlotDto(s);
                    return (
                      <SlotCard
                        key={s.start}
                        slot={dto}
                        selected={picked === s.start}
                        onSelect={() => setPicked(s.start)}
                        column
                      />
                    );
                  })}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={doCreate}
                    disabled={busy || !picked}
                    className="inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                  >
                    {busy ? "Booking…" : "Confirm booking"}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    No card is charged. A deposit is required to confirm.
                  </span>
                </div>
              </>
            )}
          </section>
        )}

        {step === "done" && (result || callbackDone) && (
          <section className="mt-6 max-w-2xl">
            <div className="panel">
              {callbackDone ? (
                <>
                  <div className="flex items-center gap-2 text-teal">
                    <CircleCheck className="size-6" />
                    <h2 className="font-display text-2xl font-semibold">Callback requested</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The owner will call you at {contact.phone} about{" "}
                    {details?.dogName || "your dog"}.
                  </p>
                </>
              ) : result?.status === "confirmed" ? (
                <>
                  <div className="flex items-center gap-2 text-teal">
                    <CircleCheck className="size-6" />
                    <h2 className="font-display text-2xl font-semibold">You're booked.</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    A deposit of {est ? money(est.deposit) : ""} is required to confirm — it is not
                    charged online.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-amber-foreground">
                    <CircleCheck className="size-6" />
                    <h2 className="font-display text-2xl font-semibold">Request received.</h2>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your requested time is held. The owner reviews it personally before confirming.
                  </p>
                </>
              )}
              {result && result.status === "confirmed" && (
                <div className="mt-3 border-t border-border pt-3 text-sm">
                  <p className="font-bold">
                    {details?.dogName} · {est ? est.lines[0]!.line : ""}
                    {details?.nails ? " + nail trim" : ""}
                  </p>
                  {(() => {
                    const s =
                      picked && avail && !avail.outOfArea
                        ? avail.slots.find((x) => x.start === picked)
                        : null;
                    return s ? (
                      <p className="mt-0.5">
                        {s.dayLabel}, {s.dateLabel} at {s.timeLabel} · about {est?.minutes} min
                      </p>
                    ) : null;
                  })()}
                  <p className="text-muted-foreground">
                    {contact.address}
                    {details?.postalCode ? `, ${details.postalCode}` : ""}
                  </p>
                  <p className="mt-1">
                    Estimated price: <strong>{est ? money(est.total) : ""}</strong>
                  </p>
                </div>
              )}
              {result && result.emailStatus !== "sent" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  We couldn't send a confirmation email just now — keep your booking link below.
                </p>
              )}
              <ManageLink token={result?.token ?? null} />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ManageLink({ token }: { token: string | null }) {
  const navigate = useNavigate();
  if (!token) return null;
  return (
    <button
      onClick={() => navigate({ to: "/manage/$token", params: { token } })}
      className="mt-4 text-sm font-bold text-teal underline underline-offset-4"
    >
      Open your booking page
    </button>
  );
}

const selectCls =
  "mt-1 w-full rounded-[10px] border border-border bg-surface-strong px-3 py-2 text-sm outline-none focus:border-teal";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold text-muted-foreground">{children}</span>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={selectCls}
      />
    </label>
  );
}