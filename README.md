# PawRoute

PawRoute is a route-aware booking product for mobile pet-service businesses.

Instead of treating every open calendar slot as equally useful, PawRoute is designed to consider the service, appointment duration, customer location, existing appointments, travel time, and customer preference before recommending the appointment that best fits the day.

> Open time ≠ good time.

## Current status

PawRoute is currently a polished functional prototype.

The interface and booking flow are implemented, but several core product behaviors are still simulated with deterministic demo data. The next development phase is to replace that simulated data with a minimal production backend while preserving the existing UI and UX.

See [AUDIT.md](./AUDIT.md) for the complete production-readiness audit and implementation plan.

## Product purpose

PawRoute is intentionally narrow in scope.

Core workflow:

1. Customer submits a service request.
2. PawRoute determines the service requirements and duration.
3. The customer address is converted to a real geographic location.
4. Existing appointments and availability are evaluated.
5. Candidate appointment times are ranked by schedule fit and route impact.
6. The customer receives a quote.
7. A deposit may be collected when enabled.
8. The booking is confirmed.

PawRoute is not intended to become a generic CRM or full pet-business management platform.

## Target users

Primary users are mobile pet-service businesses where travel between appointments materially affects the schedule, starting with mobile dog groomers.

## Current application

Routes:

- `/` - product/marketing experience
- `/book` - customer booking flow
- `/owner` - owner operations dashboard

## Current features

The existing prototype includes:

- natural-language-style customer intake
- service and visit-duration interpretation UI
- route-aware appointment recommendation UI
- route-impact comparison
- quote calculation
- 25% deposit calculation
- booking confirmation flow
- self-service rescheduling flow
- owner dashboard
- exception review
- responsive desktop and mobile UI
- page metadata and basic error handling

Some of these behaviors are currently simulated. See the audit for details.

## Tech stack

- React 19
- TypeScript
- TanStack Start
- TanStack Router
- TanStack Query
- Vite
- Tailwind CSS 4
- Radix UI
- Lucide icons

The repository currently includes a Lovable-specific Vite configuration package. Removing unnecessary platform-specific runtime/build coupling is part of the production migration plan.

## Architecture direction

Target MVP architecture:

```text
Customer / Owner Browser
        |
        v
React + TanStack Start
        |
        v
Server functions / API
        |
        +--> PostgreSQL / Supabase
        |
        +--> Geocoding API
        |
        +--> Routing / travel-time API

Later:
        +--> Stripe
        +--> Email provider
        +--> SMS provider (optional)
```

GitHub will be the source of truth for the codebase, with independent deployment planned through Vercel.

## Local development

Requirements:

- Node.js
- npm

Clone and install:

```bash
git clone https://github.com/saytbork/pawroute.git
cd pawroute
npm install
cp .env.example .env.local
npm run dev
```

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```

## Environment variables

The current prototype does not require production service credentials.

Future backend integrations are documented in `.env.example`. Real credentials must never be committed to Git.

## Production build

```bash
npm run build
```

Before PawRoute is considered production-ready, the build must also be verified outside Lovable and deployed independently from this repository.

## Planned external services

Not connected yet:

- PostgreSQL / Supabase
- geocoding provider
- routing/travel-time provider
- Stripe
- transactional email provider
- optional SMS provider

## Current limitations

The current prototype uses simulated data for several critical behaviors, including:

- customer and pet records
- appointments
- availability
- addresses and coordinates
- driving time
- route-impact scoring
- quotes/pricing rules
- deposits
- booking persistence
- rescheduling persistence
- owner exception decisions
- authentication
- notifications

The detailed replacement plan is documented in [AUDIT.md](./AUDIT.md).

## Live prototype

https://route-wise-paws.lovable.app/

## Origin

PawRoute was initially created as a prototype for the 2026 Lovable Challenge on Contra.

## Author

Juan Amisano  
Senior Product & UX/UI Designer  
https://amisano-design.com/
