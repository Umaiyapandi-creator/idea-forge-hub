import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Crown, Loader2, Sparkles, Star, Zap, Rocket, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { useAuth, dashboardPathFor } from "@/lib/auth-store";
import { usePlan } from "@/lib/premium";
import { supabase } from "@/integrations/supabase/client";
import qrImage from "@/assets/payment-qr.png";

export const Route = createFileRoute("/premium")({
  head: () => ({ meta: [{ title: "Premium Membership — Way To Dream" }] }),
  component: PremiumPage,
});

const BENEFITS = [
  { icon: Rocket, title: "Unlimited Idea Uploads", desc: "Upload as many ideas as you want — no 3-idea cap." },
  { icon: Zap, title: "Priority Review", desc: "Your projects jump to the top of the founder review queue." },
  { icon: Star, title: "Featured Project Promotion", desc: "Promote projects to the Featured section." },
  { icon: Sparkles, title: "AI Project Analysis", desc: "AI-generated summary, scores and improvements." },
];

const PLANS = [
  { cycle: "quarterly" as const, title: "3 Months", price: 400, period: "for 3 months" },
  { cycle: "yearly" as const, title: "Yearly", price: 1100, period: "for 1 year", highlight: true, badge: "Best value" },
];

type PRequest = { id: string; cycle: string; amount: number; status: string; created_at: string; notes: string | null };

function PremiumPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth({ redirectIfUnauthed: true });
  const { isPremium, expiresAt } = usePlan(user?.id);
  const [selected, setSelected] = useState<"quarterly" | "yearly">("yearly");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [myReqs, setMyReqs] = useState<PRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("premium_requests").select("id,cycle,amount,status,created_at,notes")
      .eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setMyReqs((data as PRequest[]) ?? []));
  }, [user, submitting]);

  const plan = PLANS.find((p) => p.cycle === selected)!;
  const pending = myReqs.find((r) => r.status === "pending");

  const submit = async () => {
    if (!user || !file) { toast.error("Please upload your payment screenshot"); return; }
    setSubmitting(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const up = await supabase.storage.from("payment-screenshots").upload(path, file);
      if (up.error) throw up.error;
      const { error } = await supabase.from("premium_requests").insert({
        user_id: user.id, cycle: plan.cycle, amount: plan.price, screenshot_path: path,
      });
      if (error) throw error;
      toast.success("Payment submitted. Founder will verify and activate Premium.");
      setFile(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally { setSubmitting(false); }
  };

  if (loading || !user) {
    return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <DashboardShell
      title="Premium Membership"
      subtitle={isPremium ? "You are a Premium member" : "Upgrade via QR payment"}
      actions={<Link to={dashboardPathFor(user.role)}><Button variant="outline" size="sm">← Back</Button></Link>}
    >
      {isPremium && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <Crown className="h-5 w-5 text-primary" />
          <div className="text-sm">
            <div className="font-semibold">You're Premium ✨</div>
            {expiresAt && <div className="text-muted-foreground">Expires {new Date(expiresAt).toLocaleDateString()}</div>}
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
        {PLANS.map((p) => (
          <button
            key={p.cycle}
            type="button"
            onClick={() => setSelected(p.cycle)}
            className={`relative rounded-2xl border p-6 text-left transition ${
              selected === p.cycle ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/30" : "border-border bg-card"
            }`}
          >
            {p.badge && <div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{p.badge}</div>}
            <div className="text-sm font-medium text-muted-foreground">{p.title} Plan</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold">₹{p.price}</span>
              <span className="text-sm text-muted-foreground">/{p.period}</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm">
              {BENEFITS.map((b) => (
                <li key={b.title} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {b.title}</li>
              ))}
            </ul>
          </button>
        ))}
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="font-semibold">Step 1 — Scan &amp; Pay ₹{plan.price}</div>
          <p className="mt-1 text-sm text-muted-foreground">Use any UPI app (GPay, PhonePe, Paytm, BHIM).</p>
          <div className="mt-4 grid place-items-center">
            <img src={qrImage} alt="Way To Dream UPI QR" width={320} height={320} loading="lazy" className="rounded-xl border border-border" />
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="font-semibold">Step 2 — Upload payment screenshot</div>
          <p className="mt-1 text-sm text-muted-foreground">After paying, upload a clear screenshot showing the transaction ID. Founder verifies manually.</p>
          <div className="mt-4 space-y-3">
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Button onClick={submit} disabled={submitting || !file || isPremium || !!pending} className="w-full gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" /> Submit for approval</>}
            </Button>
            {pending && <p className="text-sm text-amber-600">A request is pending founder approval.</p>}
            {isPremium && <p className="text-sm text-primary">You already have active Premium.</p>}
          </div>
        </div>
      </section>

      {myReqs.length > 0 && (
        <section className="mt-10">
          <h3 className="mb-3 font-semibold">Your requests</h3>
          <div className="space-y-2">
            {myReqs.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm">
                <div>
                  <div className="font-medium">{r.cycle} — ₹{r.amount}</div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                  {r.notes && <div className="text-xs text-muted-foreground">Note: {r.notes}</div>}
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase ${
                  r.status === "approved" ? "bg-primary/10 text-primary" :
                  r.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-amber-500/10 text-amber-600"
                }`}>{r.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
