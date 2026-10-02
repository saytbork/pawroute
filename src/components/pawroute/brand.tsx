import { Link } from "@tanstack/react-router";

export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" className="fill-primary" />
      <path
        d="M9 13.5c0-1.6.6-3 1.7-3.9.4-.3 1-.1 1.1.4l.5 2.1h5.4l.5-2.1c.1-.5.7-.7 1.1-.4 1.1.9 1.7 2.3 1.7 3.9v3.2c0 1-.4 1.9-1.1 2.6l-1.3 1.2v2.1a.8.8 0 0 1-.8.8h-1.1a.8.8 0 0 1-.8-.8v-1.3h-1.8v1.3a.8.8 0 0 1-.8.8h-1.1a.8.8 0 0 1-.8-.8v-2.1l-1.3-1.2A3.6 3.6 0 0 1 9 16.7Z"
        className="fill-background"
        opacity="0.95"
      />
      <circle cx="23.5" cy="9" r="2.6" className="fill-amber" />
    </svg>
  );
}

export function SiteHeader({ active }: { active: "home" | "customer" | "owner" }) {
  const pill = (on: boolean) =>
    `whitespace-nowrap rounded-md px-2 py-1.5 transition-colors sm:px-3 ${
      on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
    }`;
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 rounded-md"
          aria-label="PawRoute home"
        >
          <BrandMark className="size-7" />
          <span className="hidden font-display text-lg leading-none tracking-tight sm:inline">
            PawRoute
          </span>
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <nav
            aria-label="Product"
            className="hidden items-center gap-5 text-sm font-semibold text-muted-foreground lg:flex"
          >
            <Link to="/" hash="how" className="hover:text-foreground">
              How it works
            </Link>
            <Link to="/" hash="why" className="hover:text-foreground">
              Why PawRoute
            </Link>
          </nav>
          <nav
            aria-label="Product views"
            className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface-strong p-1 text-[11px] font-semibold sm:gap-1 sm:text-xs"
          >
            <Link to="/request" className={pill(active === "customer")}>
              Book a visit
            </Link>
            <Link to="/dashboard" className={pill(active === "owner")}>
              Owner dashboard
            </Link>
          </nav>
          {active === "home" && (
            <Link
              to="/request"
              className="hidden h-9 items-center rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 md:inline-flex"
            >
              Try PawRoute
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function DemoBanner() {
  return (
    <div className="border-b border-border bg-surface-strong">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-2 text-xs text-muted-foreground sm:px-6">
        Sample flow with example data — not connected to real bookings.{" "}
        <Link to="/request" className="font-semibold text-teal underline underline-offset-2">
          Book a real visit
        </Link>
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-strong">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark className="size-7" />
            <span className="font-display text-lg">PawRoute</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Route-aware booking for mobile dog groomers. One customer message becomes a
            route-compatible appointment; the owner handles only exceptions.
          </p>
        </div>
        <div className="text-sm">
          <p className="label-eyebrow">Product</p>
          <ul className="mt-3 space-y-2 font-semibold">
            <li>
              <Link to="/request" className="hover:text-teal">
                Book a visit
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-teal">
                Owner dashboard
              </Link>
            </li>
            <li>
              <Link to="/" hash="how" className="hover:text-teal">
                How it works
              </Link>
            </li>
            <li>
              <Link to="/" hash="faq" className="hover:text-teal">
                FAQ
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-teal">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm text-muted-foreground">
          <p className="label-eyebrow">Sample flow</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/book" className="hover:text-teal">
                Example customer flow
              </Link>
            </li>
            <li>
              <Link to="/owner" className="hover:text-teal">
                Example owner dashboard
              </Link>
            </li>
          </ul>
          <p className="mt-4">
            Early access experience. Some operational integrations are still being finalized.
          </p>
        </div>
      </div>
    </footer>
  );
}