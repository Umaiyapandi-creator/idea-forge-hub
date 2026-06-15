import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/project/new")({
  head: () => ({ meta: [{ title: "Upload idea — Way to Dream" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const { user } = useAuth({ redirectIfUnauthed: true });
  const [f, setF] = useState({ name: "", problem: "", solution: "", industry: "", funding: "", summary: "" });
  const [image, setImage] = useState<File | null>(null);
  const [ppt, setPpt] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!f.name.trim() || !f.problem.trim()) { toast.error("Idea name and problem statement are required"); return; }
    setBusy(true);
    try {
      const { data: project, error } = await supabase.from("projects").insert({
        owner_id: user.id,
        name: f.name.trim(),
        problem: f.problem.trim(),
        solution: f.solution.trim() || null,
        industry: f.industry.trim() || null,
        funding_needed: f.funding.trim() || null,
        public_summary: f.summary.trim() || null,
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
        const { error: upErr } = await supabase.from("projects").update(patch).eq("id", pid);
        if (upErr) throw upErr;
      }
      toast.success("Project submitted");
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
            <Input id="ppt" type="file" accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" onChange={(e) => setPpt(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <Label htmlFor="pdf">Upload PDF</Label>
            <Input id="pdf" type="file" accept="application/pdf,.pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit project"}
        </Button>
      </form>
    </DashboardShell>
  );
}
