# PawRoute MVP — production-readiness pass

- [x] Database schema, RLS, owner seat, no-overlap constraint
- [x] Real booking, manage, reschedule, cancel, owner dashboard
- [x] Remaining tests (production-mode page hiding checked in code only; needs APP_MODE=production to see it live)
- [x] Cleanup: test owner, roles and QA bookings removed; email confirmation back on; owner seat open
- [x] Docs: README, .env.example, migrations

## Future (not implemented)
- Stripe deposits (deposit is shown as required, never collected)
- SMS notifications