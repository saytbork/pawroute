import { Link } from "@tanstack/react-router";

export function BrandMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" className="fill-primary" />
      {/* abstract dog silhouette + route dot */}
      <path
        d="M9 13.5c0-1.6.6-3 1.7-3.9.4-.3 1-.1 1.1.4l.5 2.1h5.4l.5-2.1c.1-.5.7-.7 1.1-.4 1.1.9 1.7 2.3 1.7 3.9v3.2c0 1-.4 1.9-1.1 2.6l-1.3 1.2v2.1a.8.8 0 0 1-.8.8h-1.1a.8.8 0 0 1-.8-.8v-1.3h-1.8v1.3a.8.8 0 0 1-.8.8h-1.1a.8.8 0 0 1-.8-.8v-2.1l-1.3-1.2A3.6 3.6 0 0 1 9 16.7Z"
        className="fill-background"
        opacity="0.95"
      />
      <circle cx="23.5" cy="9" r="2.6" className="fill-amber" />
    </svg>
  );
}

export function SiteHeader({ active }: { active: "customer" | "owner" }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto grid h-14 w-full max-w-[1280px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandMark className="size-7" />
          <span className="font-display text-lg leading-none tracking-tight">PawRoute</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Mobile dog grooming · Winnipeg
          </span>
        </Link>
        <nav aria-label="Demo views" className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-surface-strong p-1 text-[11px] font-semibold sm:gap-1 sm:text-xs">
          <Link
            to="/"
            className={`whitespace-nowrap rounded-md px-2 py-1.5 transition-colors sm:px-3 ${
              active === "customer" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Customer booking
          </Link>
          <Link
            to="/owner"
            className={`whitespace-nowrap rounded-md px-2 py-1.5 transition-colors sm:px-3 ${
              active === "owner" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Owner dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}