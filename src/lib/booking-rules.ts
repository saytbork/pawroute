// Deterministic, auditable booking rules shared by browser and server.
// No model calls: every extracted value comes from a visible keyword rule.

export const SERVICES = {
  full_groom: { label: "Full groom", minutes: 90, price: 105 },
  bath_tidy: { label: "Bath + tidy", minutes: 60, price: 75 },
  puppy_intro: { label: "Puppy intro groom", minutes: 45, price: 62 },
  nails_only: { label: "Nail trim only", minutes: 20, price: 25 },
} as const;
export type ServiceId = keyof typeof SERVICES;

export const PREFERENCES = {
  morning: { label: "Morning", from: 9 * 60, to: 12 * 60 },
  afternoon: { label: "Afternoon", from: 12 * 60, to: 17 * 60 },
  late_afternoon: { label: "Late afternoon", from: 15 * 60, to: 17 * 60 + 30 },
  any: { label: "Any time", from: 0, to: 24 * 60 },
} as const;
export type PreferenceId = keyof typeof PREFERENCES;

export const MAX_ADDED_TRAVEL_MIN = 15;
export const LONG_SERVICE_MIN = 150;
export const DEPOSIT_RATE = 0.25;
export const RESCHEDULE_CUTOFF_HOURS = 24;
export const MAX_RESCHEDULES = 3;
export const LEAD_TIME_HOURS = 24;

export type Details = {
  dogName: string;
  breed: string;
  weightLb: number | null;
  service: ServiceId | null;
  nails: boolean;
  anxious: boolean;
  behaviorNotes: string;
  postalCode: string;
  preference: PreferenceId | null;
};

const BREEDS = [
  "golden retriever",
  "labrador",
  "lab mix",
  "poodle",
  "mini poodle",
  "miniature poodle",
  "cocker spaniel",
  "shih tzu",
  "husky",
  "german shepherd",
  "border collie",
  "goldendoodle",
  "labradoodle",
  "doodle",
  "bernese mountain dog",
  "bernese",
  "yorkie",
  "yorkshire terrier",
  "schnauzer",
  "bichon",
  "maltese",
  "beagle",
  "pomeranian",
  "havanese",
  "samoyed",
  "australian shepherd",
  "corgi",
];

const SAFETY_RE =
  /\b(bit|bite|bites|biting|bitten|snap|snapped|snaps|aggress\w*|growl\w*|lunge\w*|muzzle)\b/i;
const ANXIOUS_RE =
  /\b(anxious|nervous|scared|fearful|afraid|skittish|stress\w*|panic\w*|reactive)\b/i;

export function detectSafetyConcern(text: string): boolean {
  return SAFETY_RE.test(text);
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

export function parseMessage(raw: string): { details: Details; found: (keyof Details)[] } {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const found: (keyof Details)[] = [];

  let dogName = "";
  const nameMatch =
    text.match(/\b(?:named|name is|name's|called)\s+([A-Z][a-z]{1,15})/) ??
    text.match(/\b([A-Z][a-z]{1,15})\s+is\s+(?:a|an|my|our)\b/);
  if (nameMatch?.[1] && !["My", "Our", "She", "He", "It", "This"].includes(nameMatch[1])) {
    dogName = nameMatch[1];
    found.push("dogName");
  }

  const breed =
    BREEDS.filter((b) => lower.includes(b)).sort((a, b) => b.length - a.length)[0] ?? "";
  if (breed) found.push("breed");

  let weightLb: number | null = null;
  const w = lower.match(/(\d{1,3})\s*(lb|lbs|pounds|kg)\b/);
  if (w?.[1]) {
    const n = Number(w[1]);
    weightLb = w[2] === "kg" ? Math.round(n * 2.2) : n;
    found.push("weightLb");
  }

  let service: ServiceId | null = null;
  if (/\b(puppy|first groom)\b/.test(lower)) service = "puppy_intro";
  else if (/\b(full groom|haircut|hair cut|full cut)\b/.test(lower)) service = "full_groom";
  else if (/\b(bath|tidy|deshed|wash)\b/.test(lower)) service = "bath_tidy";
  else if (/\bgroom\w*\b/.test(lower)) service = "full_groom";
  else if (/\bnails?\b/.test(lower)) service = "nails_only";
  if (service) found.push("service");

  const nails = service !== "nails_only" && /\bnails?\b/.test(lower);
  const anxious = ANXIOUS_RE.test(text);
  const notes: string[] = [];
  if (anxious) notes.push("Anxious / nervous");
  if (/dryer/.test(lower)) notes.push("Sensitive to dryers");
  if (/arthritis|senior|old|mobility/.test(lower)) notes.push("Senior / mobility care");
  if (detectSafetyConcern(text)) notes.push("Possible bite or aggression history");
  if (notes.length) found.push("behaviorNotes");

  let postalCode = "";
  const pc = text.match(/\b([A-Za-z]\d[A-Za-z])\s?(\d[A-Za-z]\d)\b/);
  if (pc?.[1] && pc[2]) {
    postalCode = `${pc[1]} ${pc[2]}`.toUpperCase();
    found.push("postalCode");
  }

  let preference: PreferenceId | null = null;
  if (/late afternoon|after work|evening/.test(lower)) preference = "late_afternoon";
  else if (/afternoon/.test(lower)) preference = "afternoon";
  else if (/morning/.test(lower)) preference = "morning";
  else if (/any ?time|flexible|whenever/.test(lower)) preference = "any";
  if (preference) found.push("preference");

  return {
    details: {
      dogName,
      breed: breed ? titleCase(breed) : "",
      weightLb,
      service,
      nails,
      anxious,
      behaviorNotes: notes.join("; "),
      postalCode,
      preference,
    },
    found,
  };
}

export function normalizePostal(input: string): string | null {
  const m = input
    .trim()
    .toUpperCase()
    .match(/^([A-Z]\d[A-Z])\s?(\d[A-Z]\d)$/);
  return m ? `${m[1]} ${m[2]}` : null;
}

export function estimateVisit(d: Pick<Details, "service" | "weightLb" | "nails" | "anxious">) {
  const svc = SERVICES[d.service ?? "full_groom"];
  const lines: { line: string; amount: number }[] = [{ line: svc.label, amount: svc.price }];
  let minutes: number = svc.minutes;
  const w = d.weightLb ?? 0;
  if (d.service !== "nails_only") {
    if (w > 60) {
      lines.push({ line: "Large dog (60 lb+)", amount: 25 });
      minutes += 20;
    } else if (w >= 40) {
      lines.push({ line: "Medium-large dog (40–60 lb)", amount: 15 });
      minutes += 10;
    }
  }
  if (d.nails) {
    lines.push({ line: "Nail trim", amount: 15 });
    minutes += 10;
  }
  if (d.anxious) {
    lines.push({ line: "Behaviour accommodation", amount: 12 });
    minutes += 15;
  }
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return {
    lines,
    minutes,
    total,
    deposit: Math.round(total * DEPOSIT_RATE * 100) / 100,
    bufferMin: d.anxious ? 20 : 15,
  };
}

export const money = (n: number) => `$${n.toFixed(2)}`;