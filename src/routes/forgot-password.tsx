import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Way to Dream" }] }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your inbox for a reset link");
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-background via-background to-accent/30 px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo size={40} /></div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
          <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-foreground">We'll email you a secure reset link.</p>
          {sent ? (
            <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, a reset link is on its way.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/auth" className="text-primary hover:underline">← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
