import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/project/new")({
  head: () => ({ meta: [{ title: "Upload idea — Way to Dream" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", problem: "", solution: "", industry: "", stage: "", funding: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.problem) {
      toast.error("Please fill required fields");
      return;
    }
    toast.success("Project submitted for review");
    navigate({ to: "/innovator" });
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
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" placeholder="AI, Fintech…" value={f.industry} onChange={(e) => setF({ ...f, industry: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="stage">Prototype stage</Label>
            <Input id="stage" placeholder="Idea / MVP / Beta" value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="funding">Funding needed</Label>
            <Input id="funding" placeholder="$50,000" value={f.funding} onChange={(e) => setF({ ...f, funding: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="file">Upload PPT / PDF</Label>
          <Input id="file" type="file" />
        </div>
        <Button type="submit" size="lg" className="w-full">Submit project</Button>
      </form>
    </DashboardShell>
  );
}
