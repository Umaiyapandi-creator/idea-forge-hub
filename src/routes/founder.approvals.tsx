import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Check, X, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/DashboardShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/founder/approvals")({
  head: () => ({ meta: [{ title: "Founder Approvals — Way To Dream" }] }),
  component: Page,
});

type PReq = { id: string; user_id: string; cycle: "quarterly" | "yearly"; amount: number; screenshot_path: string; status: string; created_at: string };
type Proj = { id: string; name: string; owner_id: string; industry: string | null; status: string; created_at: string; public_summary: string | null };

function Page() {
  const navigate = useNavigate();
  const { user, loading } = useAuth({ redirectIfUnauthed: true });
  const [preqs, setPreqs] = useState<PReq[]>([]);
  const [projects, setProjects] = useState<Proj[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "founder" && user.role !== "admin") {
      toast.error("Founder access only");
      navigate({ to: "/auth" });
    }
  }, [user, navigate]);

  const load = async () => {
    const [{ data: pr }, { data: pj }] = await Promise.all([
      supabase.from("premium_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("id,name,owner_id,industry,status,created_at,public_summary").order("created_at", { ascending: false }),
    ]);
    setPreqs((pr as PReq[]) ?? []);
    setProjects((pj as Proj[]) ?? []);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const signedUrl = async (path: string) => {
    const { data } = await supabase.storage.from("payment-screenshots").createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  };

  const decidePremium = async (r: PReq, approve: boolean) => {
    setBusy(r.id);
    try {
      const { error } = await supabase.from("premium_requests").update({ status: approve ? "approved" : "rejected" }).eq("id", r.id);
      if (error) throw error;
      if (approve) {
        const exp = new Date();
        if (r.cycle === "quarterly") exp.setMonth(exp.getMonth() + 3);
        else exp.setFullYear(exp.getFullYear() + 1);
        const { error: pe } = await supabase.from("profiles")
          .update({ plan: "premium", plan_expires_at: exp.toISOString() }).eq("id", r.user_id);
        if (pe) throw pe;
      }
      toast.success(approve ? "Premium activated" : "Rejected");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  };

  const decideProject = async (p: Proj, next: "approved" | "rejected") => {
    setBusy(p.id);
    const { error } = await supabase.from("projects").update({ status: next }).eq("id", p.id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Project ${next}`);
    load();
  };

  if (loading || !user) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const pendingPremium = preqs.filter((r) => r.status === "pending");
  const pendingProjects = projects.filter((p) => p.status === "pending");

  return (
    <DashboardShell
      title="Founder Approvals"
      subtitle="Review premium payments and project submissions"
      actions={<Link to="/admin"><Button variant="outline" size="sm">← Dashboard</Button></Link>}
    >
      <Tabs defaultValue="premium">
        <TabsList>
          <TabsTrigger value="premium">Premium ({pendingPremium.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({pendingProjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="premium" className="mt-4 space-y-3">
          {preqs.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
          {preqs.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">₹{r.amount} — {r.cycle}</div>
                  <div className="text-xs text-muted-foreground">User {r.user_id.slice(0, 8)} · {new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => signedUrl(r.screenshot_path)} className="gap-1"><ImageIcon className="h-3 w-3" /> View proof</Button>
                  {r.status === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => decidePremium(r, true)} disabled={busy === r.id} className="gap-1"><Check className="h-3 w-3" /> Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => decidePremium(r, false)} disabled={busy === r.id} className="gap-1"><X className="h-3 w-3" /> Reject</Button>
                    </>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${r.status === "approved" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>{r.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="projects" className="mt-4 space-y-3">
          {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
          {projects.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.industry ?? "—"} · {new Date(p.created_at).toLocaleString()}</div>
                  {p.public_summary && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.public_summary}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/project/$id" params={{ id: p.id }}><Button variant="outline" size="sm" className="gap-1"><ExternalLink className="h-3 w-3" /> Open</Button></Link>
                  {p.status === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => decideProject(p, "approved")} disabled={busy === p.id} className="gap-1"><Check className="h-3 w-3" /> Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => decideProject(p, "rejected")} disabled={busy === p.id} className="gap-1"><X className="h-3 w-3" /> Reject</Button>
                    </>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${p.status === "approved" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
