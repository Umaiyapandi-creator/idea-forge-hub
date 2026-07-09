import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Lock, Loader2, Crown, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { usePlan } from "@/lib/premium";
import { PremiumBadge, FeaturedBadge, PriorityBadge } from "@/components/PremiumBadge";
import { ProjectChat } from "@/components/ProjectChat";
import type { AiAnalysis } from "@/lib/ai-analysis.functions";

export const Route = createFileRoute("/project/$id")({
  head: () => ({ meta: [{ title: "Project — Way to Dream" }] }),
  component: Page,
});

type ProjectRow = {
  id: string; name: string; owner_id: string; industry: string | null;
  funding_needed: string | null; problem: string; solution: string | null;
  public_summary: string | null; status: string;
  is_priority: boolean; is_featured: boolean;
  ai_analysis: AiAnalysis | null;
};

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth({ redirectIfUnauthed: true });
  const { isPremium } = usePlan(user?.id);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("projects")
      .select("id,name,owner_id,industry,funding_needed,problem,solution,public_summary,status,is_priority,is_featured,ai_analysis")
      .eq("id", id).maybeSingle();
    setProject(data as ProjectRow | null);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!project) return <DashboardShell title="Not found"><p className="text-sm text-muted-foreground">Project not found.</p></DashboardShell>;

  const isOwner = user?.id === project.owner_id;

  const togglePromote = async () => {
    if (!isPremium) { toast.error("Upgrade to Premium to Promote Your Project."); return; }
    setPromoting(true);
    const { error } = await supabase.from("projects").update({ is_featured: !project.is_featured }).eq("id", project.id);
    setPromoting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(project.is_featured ? "Removed from Featured" : "Project promoted to Featured");
    load();
  };

  return (
    <DashboardShell
      title={project.name}
      subtitle="Project workspace"
      actions={<Link to="/innovator"><Button variant="outline" size="sm">← Back</Button></Link>}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">{project.status}</span>
        {project.is_priority && <PriorityBadge />}
        {project.is_featured && <FeaturedBadge />}
        {isOwner && (
          <Button size="sm" variant={project.is_featured ? "outline" : "default"} onClick={togglePromote} disabled={promoting} className="ml-auto gap-1">
            <Star className="h-3 w-3" /> {project.is_featured ? "Unpromote" : "Promote Project"}
            {!isPremium && <Crown className="h-3 w-3" />}
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 rounded-xl border border-border bg-card p-6">
          {project.industry && <div className="text-xs text-muted-foreground">Industry: {project.industry}</div>}
          {project.funding_needed && <div className="text-xs text-muted-foreground">Funding: {project.funding_needed}</div>}
          <h3 className="mt-4 font-semibold">Problem</h3>
          <p className="mt-1 text-sm text-muted-foreground">{project.problem}</p>
          {project.solution && <>
            <h3 className="mt-4 font-semibold">Solution</h3>
            <p className="mt-1 text-sm text-muted-foreground">{project.solution}</p>
          </>}
          {project.public_summary && <>
            <h3 className="mt-4 font-semibold">Public summary</h3>
            <p className="mt-1 text-sm text-muted-foreground">{project.public_summary}</p>
          </>}
        </TabsContent>

        <TabsContent value="analysis" className="mt-6 rounded-xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Project Analysis</h3>
            <PremiumBadge />
          </div>
          {isOwner && !isPremium ? (
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-6 text-center">
              <p className="text-sm">AI Project Analysis is available for Premium Members.</p>
              <Link to="/premium"><Button className="mt-3 gap-2"><Crown className="h-4 w-4" /> Upgrade to Premium</Button></Link>
            </div>
          ) : project.ai_analysis ? (
            <Analysis a={project.ai_analysis} />
          ) : (
            <p className="text-sm text-muted-foreground">No analysis available yet.</p>
          )}
        </TabsContent>

        <TabsContent value="docs" className="mt-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Documents are NDA-protected. Request access to view.</span>
          </div>
          <Button className="mt-4" onClick={() => toast.success("Access request sent to founder")}>Request access</Button>
        </TabsContent>
        <TabsContent value="team" className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No team members yet.
        </TabsContent>
        <TabsContent value="investors" className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Pending investor requests will appear here.
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function Analysis({ a }: { a: AiAnalysis }) {
  return (
    <div className="space-y-5 text-sm">
      {a.summary && <div><div className="font-medium text-foreground">Summary</div><p className="text-muted-foreground">{a.summary}</p></div>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Score label="Market Potential" value={a.market_potential} />
        <Score label="Innovation" value={a.innovation} />
        <Score label="Startup Readiness" value={a.startup_readiness} />
      </div>
      {a.strengths && a.strengths.length > 0 && (
        <div>
          <div className="font-medium text-foreground">Strengths</div>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">{a.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      {a.improvements && a.improvements.length > 0 && (
        <div>
          <div className="font-medium text-foreground">Improvement Suggestions</div>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">{a.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      )}
      {a.raw && <pre className="whitespace-pre-wrap rounded bg-muted p-3 text-xs">{a.raw}</pre>}
    </div>
  );
}

function Score({ label, value }: { label: string; value?: number }) {
  const v = typeof value === "number" ? value : 0;
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{v}<span className="text-sm text-muted-foreground">/100</span></div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, v))}%` }} />
      </div>
    </div>
  );
}
