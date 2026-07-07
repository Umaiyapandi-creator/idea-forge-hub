import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Crown, Loader2, Sparkles, Star, Zap, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth, dashboardPathFor } from "@/lib/auth-store";
import { usePlan, upgradeToPremium } from "@/lib/premium";

export const Route = createFileRoute("/premium")({
  head: () => ({ meta: [{ title: "Premium Membership — Way To Dream" }] }),
  component: PremiumPage,
});

const BENEFITS = [
  { icon: Rocket, title: "Unlimited Idea Uploads", desc: "Upload as many ideas as you want — no 3-idea cap." },
  { icon: Zap, title: "Priority Review", desc: "Your projects jump to the top of the admin review queue." },
  { icon: Star, title: "Featured Project Promotion", desc: "Promote projects to the Featured section for more visibility." },
  { icon: Sparkles, title: "AI Project Analysis", desc: "Get an AI-generated summary, scores and improvement suggestions." },
];

function PremiumPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth({ redirectIfUnauthed: true });
  const { isPremium, expiresAt, refresh } = usePlan(user?.id);
  const [busy, setBusy] = useState<"monthly" | "yearly" | null>(null);

  const upgrade = async (cycle: "monthly" | "yearly") => {
    if (!user) return;
    setBusy(cycle);
    try {
      await upgradeToPremium(user.id, cycle);
      await refresh();
      toast.success("Welcome to Premium!");
      navigate({ to: dashboardPathFor(user.role) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upgrade failed");
    } finally { setBusy(null); }
  };

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <DashboardShell
      title="Premium Membership"
      subtitle={isPremium ? "You are a Premium member" : "Unlock the full Way To Dream experience"}
      actions={<Link to={dashboardPathFor(user.role)}><Button variant="outline" size="sm">← Back</Button></Link>}
    >
      {isPremium && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <Crown className="h-5 w-5 text-primary" />
          <div className="text-sm">
            <div className="font-semibold text-foreground">You're Premium ✨</div>
            {expiresAt && <div className="text-muted-foreground">Renews / expires on {new Date(expiresAt).toLocaleDateString()}</div>}
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map((b) => {
          const I = b.icon;
          return (
            <div key={b.title} className="rounded-xl border border-border bg-card p-5">
              <I className="h-6 w-6 text-primary" />
              <div className="mt-3 font-semibold">{b.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{b.desc}</p>
            </div>
          );
        })}
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <PlanCard
          title="Monthly"
          price="₹99"
          period="/month"
          highlight={false}
          busy={busy === "monthly"}
          disabled={isPremium || !!busy}
          onClick={() => upgrade("monthly")}
        />
        <PlanCard
          title="Yearly"
          price="₹999"
          period="/year"
          badge="Save 16%"
          highlight
          busy={busy === "yearly"}
          disabled={isPremium || !!busy}
          onClick={() => upgrade("yearly")}
        />
      </section>
    </DashboardShell>
  );
}

function PlanCard({ title, price, period, highlight, badge, busy, disabled, onClick }: {
  title: string; price: string; period: string; highlight?: boolean; badge?: string;
  busy: boolean; disabled: boolean; onClick: () => void;
}) {
  return (
    <div className={`relative rounded-2xl border p-6 ${highlight ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card"}`}>
      {badge && <div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{badge}</div>}
      <div className="text-sm font-medium text-muted-foreground">{title} Plan</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {BENEFITS.map((b) => (
          <li key={b.title} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {b.title}</li>
        ))}
      </ul>
      <Button className="mt-6 w-full" size="lg" onClick={onClick} disabled={disabled}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade to Premium"}
      </Button>
    </div>
  );
}
