import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { usePlan, PREMIUM_FREE_IDEA_LIMIT } from "@/lib/premium";
import { useServerFn } from "@tanstack/react-start";
import { analyzeProject } from "@/lib/ai-analysis.functions";

export const Route = createFileRoute("/project/new")({
  head: () => ({ meta: [{ title: "Upload idea — Way to Dream" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { user } = useAuth({ redirectIfUnauthed: true });
  const { isPremium, loading: planLoading } = usePlan(user?.id);
  const analyze = useServerFn(analyzeProject);
  const [f, setF] = useState({ name: "", problem: "", solution: "", industry: "", funding: "", summary: "" });
  const [image, setImage] = useState<File | null>(null);
  const [ppt, setPpt] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [existingCount, setExistingCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("data").select("id", { count: "exact", head: true }).eq("owner_id", user.id)
      .then(({ count }) => setExistingCount(count ?? 0));
  }, [user]);

  const overLimit = !isPremium && existingCount !== null && existingCount >= PREMIUM_FREE_IDEA_LIMIT;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (overLimit) { toast.error("Upgrade to Premium for Unlimited Idea Uploads."); return; }
    if (!f.name.trim() || !f.problem.trim()) { toast.error("Idea name and problem statement are required"); return; }
    setBusy(true);
    try {
      const { data: project, error } = await supabase.from("data").insert({
        owner_id: user.id,
        name: f.name.trim(),
        problem: f.problem.trim(),
        solution: f.solution.trim() || null,
        industry: f.industry.trim() || null,
        funding_needed: f.funding.trim() || null,
        public_summary: f.summary.trim() || null,
        is_priority: isPremium,
        status: "pending",
      }).select("id").single();
      if (error) throw error;
      const pid = project.id;

      const upload = async (bucket: string, file: File, kind: string) => {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${pid}/${kind}-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: true });
        if (upErr) throw upErr;
        return path;
      };
      const patch: { image_path?: string; ppt_path?: string; pdf_path?: string } = {};
      if (image) patch.image_path = await upload("project-images", image, "cover");
      if (ppt) patch.ppt_path = await upload("project-docs", ppt, "ppt");
      if (pdf) patch.pdf_path = await upload("project-docs", pdf, "pdf");
      if (Object.keys(patch).length) {
        const { error: upErr } = await supabase.from("data").update(patch).eq("id", pid);
        if (upErr) throw upErr;
      }

      if (isPremium) {
        toast.success("Project submitted — generating AI analysis...");
        try {
          await analyze({ data: {
            projectId: pid, name: f.name.trim(), problem: f.problem.trim(),
            solution: f.solution.trim() || null, industry: f.industry.trim() || null,
          } });
        } catch (err) {
          console.error("AI analysis failed", err);
        }
      } else {
        toast.success("Project submitted");
      }
      navigate({ to: "/project/$id", params: { id: pid } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardShell
      title="Upload new idea"
      subtitle="Your idea is protected — only you control who sees what"
      actions={<Link to="/innovator"><Button variant="outline" size="sm">Cancel</Button></Link>}
    >
      {!planLoading && !isPremium && existingCount !== null && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-medium">Free plan:</span> {existingCount} / {PREMIUM_FREE_IDEA_LIMIT} ideas used.
            </div>
            <Link to="/premium"><Button size="sm" variant="outline" className="gap-1"><Crown className="h-3 w-3" /> Upgrade</Button></Link>
          </div>
        </div>
      )}

      {overLimit ? (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-8 text-center">
          <Crown className="mx-auto h-10 w-10 text-primary" />
          <h3 className="mt-3 text-xl font-bold">Upgrade to Premium for Unlimited Idea Uploads.</h3>
          <p className="mt-1 text-sm text-muted-foreground">Free members can upload up to {PREMIUM_FREE_IDEA_LIMIT} ideas.</p>
          <Link to="/premium"><Button className="mt-4 gap-2"><Crown className="h-4 w-4" /> Upgrade Now</Button></Link>
        </div>
      ) : (
        <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-xl border border-border bg-card p-6">
          <div>
            <Label htmlFor="name">Idea name *</Label>
            <Input id="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="problem">Problem statement *</Label>
            <Textarea id="problem" rows={3} value={f.problem} onChange={(e) => setF({ ...f, problem: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="solution">Solution</Label>
            <Textarea id="solution" rows={3} value={f.solution} onChange={(e) => setF({ ...f, solution: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="summary">Public summary</Label>
            <Textarea id="summary" rows={2} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} placeholder="Short pitch visible to everyone" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" placeholder="AI, Fintech…" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="funding">Funding needed</Label>
              <Input id="funding" placeholder="$50,000" value={f.funding} onChange={(e) => setF({ ...f, funding: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="img">Image (optional)</Label>
            <Input id="img" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="ppt">Upload PPT</Label>
              <Input id="ppt" type="file" accept=".ppt,.pptx" onChange={(e) => setPpt(e.target.files?.[0] ?? null)} />
            </div>
            <div>
              <Label htmlFor="pdf">Upload PDF</Label>
              <Input id="pdf" type="file" accept="application/pdf,.pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          {isPremium && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              An AI Project Analysis will be generated after submission.
            </div>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit project"}
          </Button>
        </form>
      )}
    </DashboardShell>
  );
}
