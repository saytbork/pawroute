import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteHeader } from "./brand";

/** Sample flows are disabled in production mode so example data never mixes with real records. */
export function DemoGate({ mode, children }: { mode: "production" | "demo"; children: ReactNode }) {
  if (mode !== "production") return <>{children}</>;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="home" />
      <main className="mx-auto w-full max-w-xl px-4 pb-20 pt-12 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Sample flow unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The example walkthrough is turned off on this site.
        </p>
        <Link
          to="/request"
          className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          Book a visit
        </Link>
      </main>
    </div>
  );
}