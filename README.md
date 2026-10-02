# PawRoute

Route-aware booking for a mobile dog grooming business. One customer message becomes a
schedule- and travel-aware appointment; the owner handles only exceptions.

## Pages

- `/` — product homepage
- `/request` — real customer booking (parses the message, confirms details, checks real availability, saves to the database)
- `/manage/$token` — customer self-service: view, reschedule, cancel (private 48-char token)
- `/dashboard` — owner dashboard (sign-in protected; first account claims the owner seat)
- `/auth` — owner sign-in / account creation
- `/privacy` — privacy summary
- `/book`, `/owner` — sample flow with example data, isolated from production records; hidden when `APP_MODE=production`

## Backend

Lovable Cloud (Supabase) — Postgres tables `bookings`, `booking_events`, `user_roles`, `geocode_cache`;
row-level security on all of them. Public writes go through validated server functions; a Postgres
exclusion constraint (`bookings_no_overlap`, including travel buffers) makes double-booking impossible.

## Configuration

All configuration is env-driven (see `.env.example`, values go in Project Settings → Secrets):

- Business profile (`BUSINESS_NAME`, `BUSINESS_PHONE`, `BUSINESS_CITY`, `BUSINESS_TIMEZONE`,
  `SERVICE_AREA_PREFIXES`, …). Missing values in production mode show a visible "Setup incomplete" warning.
- Route optimization: set `MAPBOX_ACCESS_TOKEN` to enable geocoding and travel-time ranking. Without it the
  app never invents travel minutes — slots are checked against the schedule only and clearly labelled.
- Email: set `RESEND_API_KEY` + `FROM_EMAIL` to send confirmations and reminders. Delivery failures are
  recorded on the booking and never block or fake a send.
- Reminders: POST `/api/public/cron/reminders` hourly with header `x-cron-secret: <CRON_SECRET>`. Claiming is
  atomic, so reminders never send twice.

## Local development

```sh
bun install
npm run dev
```

## Production checklist

1. Set `APP_MODE=production` and fill every business variable (no placeholders).
2. Add `MAPBOX_ACCESS_TOKEN` if live travel ranking is wanted.
3. Add `RESEND_API_KEY` / `FROM_EMAIL` for emails; set `CRON_SECRET` and schedule the reminders endpoint.
4. Sign in once and claim the owner seat (one seat only).
5. `npm run build` and verify `/dashboard` loads real data.

## Not yet (future work)

- Real card payments / deposits (Stripe) — the deposit is currently recorded as required, not collected.
- Richer parsing and notifications — current parsing is deterministic keyword rules.