import { Ban, Car, Check, Clock, MapPin, Navigation, TriangleAlert } from "lucide-react";
import type { Slot } from "@/lib/pawroute-data";

const impactStyle = {
  low: "bg-primary text-primary-foreground",
  medium: "bg-muted text-foreground",
  high: "bg-amber/30 text-amber-foreground",
  unknown: "bg-muted text-muted-foreground",
} as const;

export function SlotCard({
  slot,
  selected,
  onSelect,
  column,
}: {
  slot: Slot;
  selected: boolean;
  onSelect: () => void;
  column?: boolean;
}) {
  const previousStop = slot.nearby
    .replace(/^Previous stop:\s*/i, "")
    .replace(/^Van starts\s*/i, "Starts ");
  const blocked = Boolean(slot.blocked);
  const impact = slot.impact ?? "low";
  const travel = slot.travelAdded ?? (slot.travelMin ? `+${slot.travelMin} min` : "—");
  const best = impact === "low" && !blocked;

  const shell = blocked
    ? "cursor-not-allowed border-2 border-dashed border-amber/80 bg-amber/10"
    : selected
      ? "border-2 border-primary bg-accent/60 shadow-[var(--shadow-lift)]"
      : "border border-border bg-surface hover:border-sage hover:bg-accent/30";

  const warning =
    blocked && slot.whyNot ? (
      <div className="rounded-md border border-amber/70 bg-surface px-3 py-2.5">
        <p className="flex items-start gap-1.5 text-sm font-extrabold leading-snug text-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-foreground" />
          {slot.whyNot[0]}
        </p>
        <p className="mt-1 pl-5.5 text-xs text-ink-soft">{slot.whyNot[1]}</p>
      </div>
    ) : null;

  if (column) {
    return (
      <button
        type="button"
        onClick={blocked ? undefined : onSelect}
        aria-disabled={blocked}
        className={`flex h-full w-full flex-col rounded-lg p-4 text-left transition-all ${shell}`}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-xs font-extrabold uppercase ${blocked ? "text-amber-foreground" : "text-teal"}`}
          >
            {slot.tag ?? "Available"}
          </span>
          {blocked ? (
            <Ban className="size-5 shrink-0 text-amber-foreground" />
          ) : (
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-full border ${selected ? "border-primary bg-primary" : "border-border"}`}
            >
              {selected ? <Check className="size-3 text-primary-foreground" /> : null}
            </span>
          )}
        </div>
        <p
          className={`mt-1 font-display leading-tight ${best ? "text-3xl" : "text-2xl"} ${blocked ? "text-ink-soft" : ""}`}
        >
          {slot.day.slice(0, 3)} {slot.time}
        </p>
        <p
          className={`mt-2 font-display text-xl leading-none ${impact === "high" ? "text-amber-foreground" : "text-foreground"}`}
        >
          {travel}{" "}
          <span className="font-sans text-xs font-bold text-muted-foreground">
            {blocked ? "driving" : "travel"}
          </span>
        </p>
        <span
          className={`mt-2 w-fit rounded px-2 py-1 text-[11px] font-extrabold uppercase ${impactStyle[impact]}`}
        >
          {impact === "unknown" ? "route not checked" : `${impact} route impact`}
        </span>
        <p className="mt-3 text-sm font-semibold leading-snug">{slot.reason}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Preference: {slot.preferenceMatch ?? "Match"} · From {previousStop}
        </p>
        {warning ? <div className="mt-3">{warning}</div> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={blocked ? undefined : onSelect}
      aria-disabled={blocked}
      className={`w-full rounded-lg p-4 text-left transition-all ${shell}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-xs font-extrabold uppercase ${blocked ? "text-amber-foreground" : "text-teal"}`}
            >
              {slot.tag ?? "Available"}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-extrabold uppercase ${impactStyle[impact]}`}
            >
              {impact === "unknown" ? "route not checked" : `${impact} route impact`}
            </span>
          </div>
          <p
            className={`mt-1 font-display text-xl leading-tight ${blocked ? "text-ink-soft" : ""}`}
          >
            {slot.day.slice(0, 3)} · {slot.time}
          </p>
          <p className="mt-1.5 text-sm text-ink-soft">{slot.reason}</p>
        </div>
        {blocked ? (
          <Ban className="size-5 shrink-0 text-amber-foreground" />
        ) : (
          <span
            className={`grid size-5 shrink-0 place-items-center rounded-full border ${selected ? "border-primary bg-primary" : "border-border"}`}
          >
            {selected ? <Check className="size-3 text-primary-foreground" /> : null}
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground sm:grid-cols-4">
        <Meta icon={MapPin} label="Previous stop" value={previousStop} />
        <Meta icon={Car} label="Travel added" value={travel} strong={impact === "high"} />
        <Meta icon={Navigation} label="Preference" value={slot.preferenceMatch ?? "Match"} />
        <Meta icon={Clock} label="Finish" value={slot.finish} />
      </div>
      {warning ? <div className="mt-3">{warning}</div> : null}
    </button>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
  strong,
}: {
  icon: typeof Car;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <span className="flex items-start gap-1.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-teal" />
      <span>
        <strong className="text-foreground">{label}</strong>
        <br />
        <span className={strong ? "font-bold text-amber-foreground" : ""}>{value}</span>
      </span>
    </span>
  );
}