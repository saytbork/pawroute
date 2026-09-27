export type Scenario = {
  id: string;
  label: string;
  inquiry: string;
  extraction: {
    dogName: string;
    breed: string;
    weight: string;
    service: string;
    behavior: string;
    location: string;
    preference: string;
    durationMin: number;
  };
  missing: { id: string; question: string; placeholder: string }[];
  quote: { line: string; detail: string; amount: number }[];
  prep: string[];
  slots: Slot[];
};

export type RouteStop = { area: string; time: string; dog: string; driveIn?: string; isNew?: boolean };

export type Slot = {
  id: string;
  day: string;
  date: string;
  time: string;
  finish: string;
  travelMin: number;
  reason: string;
  tag?: string;
  nearby: string;
  nextStop?: string;
  travelAdded?: string;
  preferenceMatch?: string;
  impact?: "low" | "medium" | "high";
  blocked?: boolean;
  whyNot?: [string, string];
  routeDelta?: string;
  strip?: RouteStop[];
};

const baseSlots: Slot[] = [
  {
    id: "tue",
    day: "Tuesday",
    date: "Oct 7",
    time: "2:30 PM",
    finish: "4:00 PM",
    travelMin: 8,
    reason: "Fits naturally between existing stops.",
    tag: "Best fit",
    nearby: "Previous stop: River Heights",
    nextStop: "St. Boniface",
    travelAdded: "+8 min",
    preferenceMatch: "Perfect match",
    impact: "low",
    strip: [
      { area: "River Heights", time: "11:15", dog: "Max" },
      { area: "St. Vital", time: "14:30", dog: "Bailey", driveIn: "8 min", isNew: true },
      { area: "St. Boniface", time: "16:30", dog: "Coco", driveIn: "11 min" },
    ],
  },
  {
    id: "thu",
    day: "Thursday",
    date: "Oct 9",
    time: "3:15 PM",
    finish: "4:45 PM",
    travelMin: 12,
    reason: "Reasonable detour from St Mary's Rd, still in your afternoon window.",
    tag: "Good fit",
    nearby: "Previous stop: St Mary's Rd",
    travelAdded: "+12 min",
    preferenceMatch: "Good",
    impact: "medium",
  },
  {
    id: "tue-late",
    day: "Tuesday",
    date: "Oct 7",
    time: "4:30 PM",
    finish: "6:00 PM",
    travelMin: 31,
    reason: "Creates backtracking. Risk of making the next stop late.",
    tag: "Open, but not recommended",
    nearby: "Previous stop: St. Boniface",
    travelAdded: "+31 min",
    preferenceMatch: "Works",
    impact: "high",
    blocked: true,
    whyNot: ["This time is open, but I don't recommend it.", "+31 min driving, backtracking across the route."],
  },
];

export const scenarios: Scenario[] = [
  {
    id: "anxious",
    label: "Anxious large dog",
    inquiry:
      "My golden retriever is around 70 lb, gets nervous with dryers, needs a full groom and nail trim, and afternoons work best. I'm near St. Vital.",
    extraction: {
      dogName: "Bailey",
      breed: "Golden Retriever",
      weight: "Approx. 70 lb",
      service: "Full groom + nail trim",
      behavior: "Anxious around dryers",
      location: "St. Vital",
      preference: "Afternoon",
      durationMin: 90,
    },
    missing: [
      { id: "address", question: "Exact address for the van", placeholder: "e.g. 412 Dunkirk Dr" },
      { id: "coat", question: "Coat condition", placeholder: "Light matting behind ears" },
      { id: "parking", question: "Parking / access", placeholder: "Driveway, room for van" },
    ],
    quote: [
      { line: "Full groom", detail: "Bath, dry, haircut, ears", amount: 105 },
      { line: "Large dog", detail: "60–80 lb double coat", amount: 25 },
      { line: "Nail trim", detail: "Trim + file", amount: 15 },
      { line: "Behaviour accommodation", detail: "Low-noise dryer, slower pace", amount: 12 },
      { line: "Travel", detail: "Included — you're on an existing route", amount: 0 },
    ],
    prep: [
      "Take Bailey for a short walk 30 minutes before the visit",
      "Avoid feeding immediately before the appointment",
      "Clear driveway space for the grooming van",
      "Have vaccination records handy in case Maya asks",
      "Low-noise dryer is pre-set for Bailey — no extra ask needed",
    ],
    slots: baseSlots,
  },
  {
    id: "senior",
    label: "Senior dog",
    inquiry:
      "Our 12-year-old cocker spaniel has arthritis and can't stand long. She needs a tidy-up bath, ears and nails. Mornings are easier for her. We're in River Heights.",
    extraction: {
      dogName: "Millie",
      breed: "Cocker Spaniel · 12 yrs",
      weight: "Approx. 28 lb",
      service: "Gentle bath + ears + nails",
      behavior: "Arthritis — limited standing time",
      location: "River Heights",
      preference: "Morning",
      durationMin: 60,
    },
    missing: [
      { id: "address", question: "Exact address for the van", placeholder: "e.g. 88 Ash St" },
      { id: "medical", question: "Medical notes or medication", placeholder: "Daily anti-inflammatory" },
    ],
    quote: [
      { line: "Senior gentle groom", detail: "Bath, ears, light trim", amount: 78 },
      { line: "Nail trim", detail: "Trim + file", amount: 15 },
      { line: "Mobility support", detail: "Ramp, rest breaks, seated grooming", amount: 10 },
      { line: "Travel", detail: "Included — River Heights morning block", amount: 0 },
    ],
    prep: [
      "Short, slow walk before the visit — no long outings",
      "Skip breakfast within the hour before Maya arrives",
      "Keep the walkway clear so Millie doesn't need stairs",
      "Have medication notes ready for the groomer",
    ],
    slots: [
      { impact: "low", preferenceMatch: "Perfect match", id: "s1", day: "Monday", date: "Oct 6", time: "9:00 AM", finish: "10:00 AM", travelMin: 6, reason: "First stop of the day, calmest for a senior dog", tag: "Best fit", nearby: "Van starts 2.2 km away" },
      { impact: "medium", preferenceMatch: "Good", id: "s2", day: "Wednesday", date: "Oct 8", time: "10:15 AM", finish: "11:15 AM", travelMin: 10, reason: "Works with your morning preference", tag: "Good fit", nearby: "Previous stop: Corydon Ave" },
      { impact: "medium", preferenceMatch: "Works", id: "s3", day: "Thursday", date: "Oct 9", time: "8:45 AM", finish: "9:45 AM", travelMin: 7, reason: "Quiet start, extra rest breaks built in", tag: "Available", nearby: "Van starts 2.6 km away" },
    ],
  },
  {
    id: "puppy",
    label: "Puppy first groom",
    inquiry:
      "We just got a 4-month-old mini poodle, first groom ever, no idea what she needs. Weekends or late afternoons. We're in St. Boniface.",
    extraction: {
      dogName: "Juno",
      breed: "Miniature Poodle · 4 mo",
      weight: "Approx. 9 lb",
      service: "Puppy intro groom + nails",
      behavior: "First groom — needs desensitising",
      location: "St. Boniface",
      preference: "Late afternoon",
      durationMin: 45,
    },
    missing: [
      { id: "address", question: "Exact address for the van", placeholder: "e.g. 210 Tache Ave" },
      { id: "vax", question: "Vaccinations up to date?", placeholder: "Second round done" },
    ],
    quote: [
      { line: "Puppy intro groom", detail: "Short, positive first session", amount: 62 },
      { line: "Nail trim", detail: "Trim + file", amount: 12 },
      { line: "Desensitising time", detail: "Slow clipper + dryer introduction", amount: 10 },
      { line: "Travel", detail: "Included — St. Boniface afternoon block", amount: 0 },
    ],
    prep: [
      "Play with Juno beforehand so she arrives a little tired",
      "No food right before the visit",
      "Keep the driveway clear for the van",
      "Have the vaccination card ready",
    ],
    slots: [
      { impact: "low", preferenceMatch: "Perfect match", id: "p1", day: "Saturday", date: "Oct 11", time: "4:30 PM", finish: "5:15 PM", travelMin: 7, reason: "Last stop near your street", tag: "Best fit", nearby: "Previous stop: Provencher Blvd" },
      { impact: "medium", preferenceMatch: "Good", id: "p2", day: "Tuesday", date: "Oct 7", time: "4:45 PM", finish: "5:30 PM", travelMin: 11, reason: "Works with your late-afternoon preference", tag: "Good fit", nearby: "Previous stop: St. Vital" },
      { impact: "medium", preferenceMatch: "Works", id: "p3", day: "Friday", date: "Oct 10", time: "5:00 PM", finish: "5:45 PM", travelMin: 9, reason: "Quiet end of day for a nervous first-timer", tag: "Available", nearby: "Previous stop: Windsor Park" },
    ],
  },
  {
    id: "two-dogs",
    label: "Two dogs, same home",
    inquiry:
      "Two dogs at the same house — a 55 lb lab mix and a 15 lb shih tzu. Both need baths, the shih tzu needs a full haircut. Any afternoon. We're in Corydon.",
    extraction: {
      dogName: "Max & Pepper",
      breed: "Lab mix + Shih Tzu",
      weight: "55 lb + 15 lb",
      service: "2 baths + 1 full haircut",
      behavior: "Both social, groom together",
      location: "Corydon",
      preference: "Afternoon",
      durationMin: 135,
    },
    missing: [
      { id: "address", question: "Exact address for the van", placeholder: "e.g. 640 Corydon Ave" },
      { id: "order", question: "Which dog goes first?", placeholder: "Pepper — she's calmer" },
      { id: "parking", question: "Parking / access", placeholder: "Back lane, street parking" },
    ],
    quote: [
      { line: "Bath & tidy — Max", detail: "Large dog, deshed", amount: 85 },
      { line: "Full groom — Pepper", detail: "Haircut, bath, ears", amount: 78 },
      { line: "Nail trims", detail: "Both dogs", amount: 24 },
      { line: "Multi-dog visit", detail: "Same-address discount applied", amount: -20 },
      { line: "Travel", detail: "Included — one stop for both dogs", amount: 0 },
    ],
    prep: [
      "Walk both dogs before the visit",
      "No feeding right before Maya arrives",
      "Keep street parking clear for the van (135 min visit)",
      "Separate the dogs so each can come out one at a time",
    ],
    slots: [
      { impact: "low", preferenceMatch: "Perfect match", id: "t1", day: "Wednesday", date: "Oct 8", time: "1:00 PM", finish: "3:15 PM", travelMin: 5, reason: "Long block already open on the Corydon route", tag: "Best fit", nearby: "Previous stop: Grant Ave" },
      { impact: "medium", preferenceMatch: "Good", id: "t2", day: "Thursday", date: "Oct 9", time: "12:45 PM", finish: "3:00 PM", travelMin: 10, reason: "Only other day with a 135-minute window", tag: "Good fit", nearby: "Previous stop: Osborne Village" },
      { impact: "medium", preferenceMatch: "Works", id: "t3", day: "Monday", date: "Oct 13", time: "1:30 PM", finish: "3:45 PM", travelMin: 8, reason: "Next week, with a wider buffer for two dogs", tag: "Available", nearby: "Previous stop: River Heights" },
    ],
  },
];

export const sampleInquiry = scenarios[0]!.inquiry;

export const rescheduleSlots: Slot[] = [
  {
    id: "r1",
    day: "Wednesday",
    date: "Oct 8",
    time: "2:00 PM",
    finish: "3:30 PM",
    travelMin: 7,
    reason: "Swaps cleanly with a nearby stop on the same loop.",
    tag: "Route-compatible",
    nearby: "Previous stop: Dakota St",
    travelAdded: "+2 min",
    preferenceMatch: "Perfect match",
    impact: "low",
    routeDelta: "+2 min",
  },
  {
    id: "r2",
    day: "Thursday",
    date: "Oct 9",
    time: "3:15 PM",
    finish: "4:45 PM",
    travelMin: 12,
    reason: "Still inside your afternoon preference.",
    tag: "Route-compatible",
    nearby: "Previous stop: St Mary's Rd",
    travelAdded: "+6 min",
    preferenceMatch: "Good",
    impact: "medium",
    routeDelta: "+6 min",
  },
  {
    id: "r3",
    day: "Wednesday",
    date: "Oct 8",
    time: "9:00 AM",
    finish: "10:30 AM",
    travelMin: 34,
    reason: "Open on the calendar, but the van is across the city.",
    tag: "Not available for self-service",
    nearby: "Previous stop: Transcona",
    travelAdded: "+34 min",
    preferenceMatch: "Outside preference",
    impact: "high",
    blocked: true,
    whyNot: [
      "Technically open, but unavailable for self-service because it would disrupt the route.",
      "+34 min driving and a late arrival downstream.",
    ],
  },
];

export const ownerAutomated = [
  { label: "Inquiries interpreted", value: 6 },
  { label: "Bookings confirmed", value: 4 },
  { label: "Deposits recorded", value: 3 },
  { label: "Reschedules handled", value: 2 },
  { label: "Prep reminders sent", value: 3 },
];

export type Exception = {
  id: string;
  title: string;
  customer: string;
  dog: string;
  summary: string;
  quote: string;
  detail: string[];
  kind: "behavior" | "zone";
};

export const exceptions: Exception[] = [
  {
    id: "bite",
    title: "Potential bite history",
    customer: "Dana R. · Fort Richmond",
    dog: "Rocco · Border Collie · 48 lb",
    summary: "Potential handling risk detected.",
    quote:
      "\"He snapped once during a previous nail trim.\"",
    detail: [
      "PawRoute flagged the inquiry before quoting — no deposit was requested",
      "Suggested: 20-minute meet-and-greet before the first full groom",
      "Visit duration would increase from 75 to 95 minutes",
    ],
    kind: "behavior",
  },
  {
    id: "zone",
    title: "Address outside regular service zone",
    customer: "Priya S. · Oak Bluff",
    dog: "Nala · Bernese Mountain Dog · 84 lb",
    summary: "18 km past the St. Norbert boundary — travel fee needs approval.",
    quote: "\"We're just off the Perimeter near Oak Bluff, is that too far for you?\"",
    detail: [
      "Extra drive time: 22 min each way, only viable as a last stop",
      "Suggested travel fee: $28 added to the quote",
      "PawRoute is holding Friday 4:45 PM until you decide",
    ],
    kind: "zone",
  },
];

export const todaysRoute = [
  { time: "9:00 AM", area: "River Heights", dog: "Luna", service: "Bath + tidy", drive: "First stop", status: "done" },
  { time: "11:15 AM", area: "Corydon", dog: "Max", service: "Full groom", drive: "9 min drive", status: "done" },
  { time: "2:30 PM", area: "St. Vital", dog: "Bailey", service: "Full groom + nails", drive: "8 min drive", status: "next" },
  { time: "4:30 PM", area: "St. Boniface", dog: "Coco", service: "Puppy groom", drive: "11 min drive", status: "upcoming" },
];