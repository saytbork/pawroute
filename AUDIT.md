# PawRoute Production Readiness Audit

Audit date: 2026-10-02

Scope: convert the existing PawRoute Lovable prototype into the smallest real, maintainable, independently deployable micro-SaaS while preserving the current UI, visual identity, layout, typography, spacing, and core booking UX.

No major product implementation is included in this audit.

---

## A. Current architecture

PawRoute is currently a frontend-first prototype built with:

- React 19
- TypeScript
- TanStack Start / TanStack Router
- Vite
- Tailwind CSS 4
- Radix UI components
- React Query

Current routes:

- `/` - product/marketing page
- `/book` - customer booking demo
- `/owner` - owner dashboard demo

The project currently has no production database enabled for PawRoute.

The application behavior is primarily driven by:

- `src/lib/pawroute-data.ts`
- React `useState`
- hardcoded scenarios
- hardcoded appointment slots
- hardcoded travel times
- simulated delays using `setTimeout`

There is currently no real persistence layer, authentication system, maps/routing integration, payment integration, notification provider, or production scheduling engine.

---

## B. What is already real and functional

The frontend application itself is implemented and should be preserved.

Already functional:

- responsive React application
- TanStack routing
- working navigation
- customer booking flow screens
- owner dashboard screens
- UI state transitions
- quote arithmetic
- 25% deposit arithmetic
- route-recommendation presentation
- reschedule presentation
- exception-review UI
- SEO/page metadata
- 404 handling
- application-level error handling
- CSRF middleware for future server functions
- design tokens
- typography
- responsive breakpoints
- loading indicators
- accessibility basics such as labels and focus states

The route cards already consume structured slot data, which is useful because real route recommendation results can later replace the demo data without redesigning the interface.

---

## C. What is currently simulated, mocked, or hardcoded

### Customer request interpretation

The current free-text request is not processed by a production parser or AI service.

`matchScenario()` maps text to one of a few predefined scenarios using keyword matching.

To make this real:

- use deterministic structured fields first, or
- optionally add AI-assisted extraction later

Requires:

- scheduling/domain logic
- optional AI/LLM

### Customers

Customer examples are hardcoded and are not persisted.

To make this real:

- create customer records
- scope them to a business

Requires:

- database

### Pets

Pet name, breed, weight, behavior, and other details are embedded in demo scenario data.

Requires:

- database

### Appointments

Appointment dates and times are predefined.

No production appointment record is created.

Requires:

- database
- scheduling logic

### Locations

Areas such as River Heights, St. Vital, St. Boniface, Corydon, and Transcona are labels only.

No validated address or geographic coordinates are used.

Requires:

- database
- maps/geocoding API

### Travel times

Travel times such as 8, 12, 31, and 34 minutes are hardcoded.

No real driving-time lookup occurs.

Requires:

- routing/travel-time API

### Route optimization

Best-fit, good-fit, and high-impact route outcomes are manually authored demo values.

There is no production optimization calculation.

Requires:

- scheduling logic
- routing/travel-time API

### Availability

Availability comes from predefined `scenario.slots`.

The application does not inspect real appointments or working hours.

Requires:

- database
- scheduling logic

### Quotes and pricing

Quote lines and prices are hardcoded in the scenario data.

Quote totals are calculated correctly from those static values.

Requires:

- database-backed services/pricing rules

### Deposits and payments

The deposit amount is calculated as approximately 25% of the quote.

Payment is simulated with frontend state and a delay.

No real transaction occurs.

Requires:

- payment provider
- backend payment endpoint
- webhook verification

### Booking confirmation

Confirmation only changes frontend state.

No booking is persisted.

Requires:

- database
- backend booking operation

### Rescheduling

Reschedule slots are hardcoded in `rescheduleSlots`.

Selection only updates React state.

Requires:

- database
- scheduling logic
- routing API

### Owner dashboard

Today's route, counts, exceptions, and decisions are demo data.

Owner decisions are stored only in local React state and disappear on refresh.

Requires:

- database

### Authentication

There is currently no production owner authentication.

The owner route is publicly reachable.

Requires:

- authentication

### Email and SMS

No real confirmation, reminder, or reschedule notification is sent.

Requires:

- email provider
- optional SMS provider

---

## D. Route optimization: current implementation vs what a real implementation requires

### Current implementation

The current application does not calculate:

| Capability | Current status |
| --- | --- |
| Real street addresses | No |
| Geographic coordinates | No |
| Real road distance | No |
| Real driving time | No |
| Existing appointment locations from a database | No |
| Appointment duration | Hardcoded by scenario |
| Travel between appointments | Hardcoded |
| Available time windows | Hardcoded |
| Schedule conflicts | Not calculated |
| Backtracking | Simulated |
| Total route impact | Simulated |
| Route ranking | Predefined |

### Simplest reliable MVP approach

Do not build a complex vehicle-routing optimizer.

The MVP only needs to solve:

> Where can this new appointment be inserted into an existing day's route with the least disruption?

For each candidate slot:

Original route:

```text
Appointment A -> Appointment B
```

Candidate route:

```text
Appointment A -> NEW -> Appointment B
```

Calculate:

```text
routeImpact =
  travel(A, NEW)
+ travel(NEW, B)
- travel(A, B)
```

Example:

```text
A -> B       = 18 min
A -> NEW     = 9 min
NEW -> B     = 14 min

route impact = 9 + 14 - 18 = +5 min
```

Then:

1. generate candidate start times
2. reject schedule conflicts
3. reject insufficient-duration windows
4. account for travel/buffer time
5. score customer preference match
6. calculate route impact
7. rank valid candidates

This is sufficient to support the existing PawRoute experience.

AI is not needed for route optimization.

---

## E. Minimum database requirements

Keep the data model small.

### businesses

Suggested fields:

- id
- name
- timezone
- service_area/settings
- default_buffer_minutes
- created_at

### users

Business owner/staff relationship.

Suggested fields:

- id
- business_id
- email
- role

Some identity fields may be owned by the authentication provider.

### customers

Suggested fields:

- id
- business_id
- name
- email
- phone

### pets

Suggested fields:

- id
- customer_id
- name
- breed
- weight
- notes

### services

Suggested fields:

- id
- business_id
- name
- duration_minutes
- price

### appointments

Central operational table.

Suggested fields:

- id
- business_id
- customer_id
- start_at
- end_at
- status
- address
- latitude
- longitude
- quote_total
- deposit_status

### Availability

Do not create a complicated scheduling model initially.

Business hours and basic scheduling settings can initially live in business settings or a minimal availability structure.

### Quotes

A separate quotes table is optional for the first MVP.

### Payments

When payments are introduced, store only the information needed to reconcile with the payment provider.

---

## F. Authentication requirements

### Business owner/staff

Authentication is required.

The `/owner` route must be protected before real customer data exists.

A simple email/password or magic-link authentication flow is enough for the MVP.

Supabase Auth is a suitable option.

### Customer

Customers should not be required to create accounts for the booking flow.

A secure booking-management token can support:

- view booking
- reschedule
- cancel

without creating unnecessary account friction.

---

## G. External APIs/services required

### Database

Recommended direction:

- PostgreSQL
- Supabase is a practical managed option

### Geocoding

Required to convert:

```text
street address -> latitude / longitude
```

Possible providers include Google Maps, Mapbox, or HERE.

### Routing/travel time

Required to calculate real road travel times.

Possible providers include Google Routes or Mapbox Directions/Matrix.

A visual map is not required for the MVP.

### Email

Eventually required for confirmations and reminders.

Examples:

- Resend
- Postmark

### SMS

Optional and should not be part of the first MVP.

### AI / LLM

Optional.

PawRoute's core value does not require AI.

AI may later be used to extract structured service information from natural-language customer requests.

---

## H. Payment/deposit requirements

The current deposit experience is simulated.

Recommended future flow:

```text
quote
  ->
create Stripe Checkout / PaymentIntent
  ->
customer pays
  ->
Stripe webhook
  ->
deposit marked paid
  ->
appointment confirmed
```

The frontend must never be the authority that declares a payment successful.

Payment success must be verified server-side through the provider.

Stripe should not be connected until real booking persistence and scheduling are working.

---

## I. Security and privacy issues

### Owner dashboard is currently public

Must be protected before storing real customer information.

### Tenant isolation

Every production query must be scoped to a `business_id`.

### Customer addresses

Real customer addresses are personally identifiable information.

They must not be bundled into frontend source files or committed to Git.

### API credentials

Maps, database, payment, and notification credentials must be stored in environment variables.

### Environment handling

A safe `.env.example` should document required variables.

Real `.env` files must remain out of Git.

### Payment verification

Future payment status must be based on provider webhooks.

### Customer booking management

Future customer access should use high-entropy secure tokens.

---

## J. GitHub/codebase readiness

### Good

- TypeScript
- understandable route structure
- PawRoute-specific components separated from generic UI
- centralized design tokens
- existing `.gitignore`
- build scripts
- lint script
- formatting configuration
- repository is already available on GitHub

### Needs work

- README must document PawRoute rather than only the prototype origin
- `.env.example` is needed
- generic unused UI components should eventually be reviewed
- unused dependencies should eventually be reviewed
- `src/lib/pawroute-data.ts` currently mixes demo customers, pets, pricing, appointments, routing, dashboard metrics, and exceptions
- demo data should eventually become test fixtures or seed/demo-only data
- Lovable-specific build/runtime coupling should be reviewed before declaring the repository fully platform-independent

Target developer workflow:

```bash
git clone https://github.com/saytbork/pawroute.git
cd pawroute
npm install
cp .env.example .env.local
npm run dev
npm run build
```

The final production repository should work independently from Lovable.

---

## K. Production-readiness issues

Already reasonably implemented:

- responsive layouts
- desktop/mobile breakpoints
- basic loading indicators
- error page
- 404 handling
- metadata
- focus states
- semantic labels

Missing or incomplete:

- real network loading states
- API error states
- database failure handling
- routing-provider failure handling
- real empty dashboard state
- real no-availability state
- real booking-conflict state
- server-side input validation
- email validation
- phone validation
- address validation
- duplicate-booking prevention
- timezone-safe scheduling
- dynamic production dates
- concurrent booking protection
- owner authentication
- authorization
- persistence
- payment failure handling

Prototype-specific dates must be replaced with dynamically generated production dates.

---

## L. Recommended MVP architecture

```text
Customer / Owner Browser
        |
        v
React / TanStack Start
        |
        v
Server Functions / API
        |
   +----+-------------------+
   |                        |
   v                        v
PostgreSQL              Geocoding API
Supabase                    |
                            v
                     Routing / Travel API
```

Deployment direction:

```text
GitHub
  |
  v
Vercel
  |
  v
PawRoute application
  |
  +--> Supabase
  +--> Maps / Routing
```

Later:

```text
+ Stripe
+ transactional email
+ optional SMS
```

---

## M. Recommended implementation order

1. Make GitHub the source of truth.
2. Verify independent local install and production build.
3. Reduce unnecessary Lovable-specific build coupling.
4. Add database.
5. Add owner authentication.
6. Replace mock business/services/appointments with database data.
7. Persist customer booking requests.
8. Add address geocoding.
9. Add real travel-time calculation.
10. Generate valid candidate appointment slots.
11. Rank candidate slots by route impact and customer preference.
12. Persist confirmed bookings.
13. Make rescheduling real.
14. Persist owner exception decisions.
15. Add transactional email.
16. Add Stripe deposits.
17. Add SaaS subscription billing only after the core workflow works for a real business.

---

## N. Estimated complexity of each implementation step

| Step | Complexity |
| --- | --- |
| GitHub cleanup / ownership | Small |
| README + environment documentation | Small |
| Independent build verification | Medium |
| Supabase/Postgres setup | Medium |
| Database schema | Medium |
| Owner authentication | Medium |
| Persist customers/pets | Medium |
| Persist appointments | Medium |
| Service/pricing model | Small |
| Address geocoding | Medium |
| Travel-time API | Medium |
| Candidate-slot generator | Large |
| Route-impact ranking | Medium |
| Conflict detection | Medium |
| Real rescheduling | Medium |
| Owner exception persistence | Small |
| Email confirmation | Small |
| Stripe deposits | Medium |
| SaaS subscriptions | Medium |
| Optional AI request interpretation | Medium |

The most complex MVP task is candidate-slot generation because it must account for duration, business hours, existing appointments, travel time, buffers, and customer preferences.

---

## O. Features that should NOT be built yet

Do not add:

- full CRM
- invoicing system
- payroll
- employee scheduling
- fleet management
- multi-van optimization
- advanced dispatch
- inventory management
- customer account portal
- native mobile app
- messaging inbox
- loyalty program
- marketing automation
- complex autonomous AI agent
- AI-based route optimization
- custom map visualization
- accounting integrations
- QuickBooks integration
- advanced analytics
- complex role/permission systems
- marketplace features
- consumer memberships

PawRoute should remain focused on:

```text
customer request
-> duration + location
-> existing schedule/route
-> best-fit appointment recommendation
-> quote
-> deposit when enabled
-> confirmation
```

---

## Audit conclusion

PawRoute currently presents a convincing end-to-end SaaS experience, but the critical operational behaviors are still prototype simulations.

The correct next step is not a redesign.

The next step is to preserve the existing interface and progressively replace:

```text
hardcoded demo data
-> database-backed records

hardcoded travel time
-> routing API

hardcoded slots
-> scheduling engine

local React state
-> persistent appointments

public owner view
-> authenticated owner

simulated payment
-> Stripe later
```

This produces the smallest real PawRoute product capable of reliably delivering its core promise.
