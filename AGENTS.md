<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- PawRoute is now a real MVP: /request books real customers into the database, /dashboard is the sign-in-protected owner view, /manage/$token is customer self-service. Why: replaces the local-demo-only constraint.
- /book and /owner remain isolated sample flows (example data, banner, hidden in APP_MODE=production). Never mix sample data into production tables.
- All public writes go through validated server functions with supabaseAdmin inside the handler; never direct table writes from the client.
- Availability and reschedule re-check the slot server-side and rely on the Postgres exclusion constraint (bookings_no_overlap) as the last defense against double-booking; a conflict returns the friendly "someone just took that time" state.
- Never invent travel minutes: when MAPBOX_ACCESS_TOKEN is absent or fails, slots are labelled "route not checked" and route status is surfaced honestly.
- Emails: Resend-only, status stored on the booking (sent/failed/unconfigured); failures never block booking and never pretend to be sent.
- Roles live only in user_roles with the security-definer has_role(); the owner seat is claimed once via claim_first_owner().