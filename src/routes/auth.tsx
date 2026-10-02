import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/pawroute/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "PawRoute — Owner sign in" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setNotice("Check your email for a confirmation link, then sign in.");
        else navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader active="owner" />
      <main className="mx-auto w-full max-w-md px-4 pb-20 pt-10 sm:px-6">
        <p className="label-eyebrow">Owner access</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The owner dashboard is protected. The first account to sign in can claim the owner seat;
          after that, the seat is taken.
        </p>
        <form onSubmit={submit} className="panel mt-5 grid gap-4">
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-[10px] border border-border bg-surface-strong px-3 py-2 text-sm outline-none focus:border-teal"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-[10px] border border-border bg-surface-strong px-3 py-2 text-sm outline-none focus:border-teal"
            />
          </label>
          {error && <p className="text-sm font-semibold text-amber-foreground">{error}</p>}
          {notice && <p className="text-sm font-semibold">{notice}</p>}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center justify-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-sm font-semibold text-teal underline underline-offset-4"
          >
            {mode === "signin" ? "Create a new owner account" : "I already have an account"}
          </button>
        </form>
      </main>
    </div>
  );
}