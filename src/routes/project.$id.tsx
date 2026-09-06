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
  id: string;
  name: string;
  owner_id: string;
  industry: string | null;
  funding_needed: string | null;
  problem: string;
  solution: string | null;
  public_summary: string | null;
  status: string;
  is_priority: boolean;
  is_featured: boolean;
  ppt_path: string | null;
  pdf_path: string | null;
  ai_analysis: AiAnalysis | null;
};

function Page() {
  const { id } = Route.useParams();
  const { user } = useAuth({ redirectIfUnauthed: true });
  const { isPremium } = usePlan(user?.id);
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasDocumentAccess, setHasDocumentAccess] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [accessStatus, setAccessStatus] = useState<
  "pending" | "approved" | "rejected" | null
>(null);

const [pptUrl, setPptUrl] = useState<string | null>(null);
const [pdfUrl, setPdfUrl] = useState<string | null>(null);
const [documentsLoading, setDocumentsLoading] = useState(false);
const load = async () => {
  setLoading(true);

  const { data, error } = await supabase
    .from("data")
    .select(`
      id,
      name,
      owner_id,
      industry,
      funding_needed,
      problem,
      solution,
      public_summary,
      status,
      is_priority,
      is_featured,
      ai_analysis,
      ppt_path,
      pdf_path
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("PROJECT LOAD ERROR:", error);
    toast.error(error.message);
    setProject(null);
    setLoading(false);
    return;
  }

  setProject(data as ProjectRow | null);

  // Project owner has direct access
  if (data && user?.id === data.owner_id) {
    setHasDocumentAccess(true);
  }
  // Developer access will be checked separately
  else if (data && user?.role === "developer") {
    const { data: request, error: requestError } = await supabase
      .from("project_access_requests")
      .select("status")
      .eq("project_id", data.id)
      .eq("developer_id", user.id)
      .maybeSingle();

    if (requestError) {
      console.error("ACCESS CHECK ERROR:", Error);
      setHasDocumentAccess(false);
    } else {
      setHasDocumentAccess(request?.status === "approved");
    }
  } else {
    setHasDocumentAccess(false);
  }

  setLoading(false);
};
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);
  useEffect(() => {
  if (!user || !id) return;

  const loadAccess = async () => {
    setDocumentsLoading(true);

    try {
      // Project owner always has access
      if (user.id === project?.owner_id) {
        setAccessStatus("approved");
        return;
      }

      const { data, error } = await supabase
        .from("project_access_requests")
        .select("status")
        .eq("project_id", id)
        .eq("developer_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("ACCESS STATUS ERROR:", error);
        setAccessStatus(null);
        return;
      }

      setAccessStatus(
        data?.status === "approved" ||
        data?.status === "pending" ||
        data?.status === "rejected"
          ? data.status
          : null
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  loadAccess();
}, [user, id, project?.owner_id]);

  if (loading) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!project) return <DashboardShell title="Not found"><p className="text-sm text-muted-foreground">Project not found.</p></DashboardShell>;

  const isOwner = user?.id === project.owner_id;

  const togglePromote = async () => {
    if (!isPremium) { toast.error("Upgrade to Premium to Promote Your Project."); return; }
    setPromoting(true);
    const { error } = await supabase.from("data").update({ is_featured: !project.is_featured }).eq("id", project.id);
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

        <TabsContent
  value="docs"
  className="mt-6 rounded-xl border border-border bg-card p-6"
>
  {documentsLoading ? (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Checking document access...
    </div>
  ) : accessStatus === "approved" ? (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Project Documents</h3>
        <p className="text-sm text-muted-foreground">
          You have approved access to the NDA-protected documents.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">

        {project.pdf_path && (
          <DocumentCard
            title="Project PDF"
            type="PDF"
            path={project.pdf_path}
            onUrl={setPdfUrl}
          />
        )}

        {project.ppt_path && (
          <DocumentCard
            title="Project PPT"
            type="PPT"
            path={project.ppt_path}
            onUrl={setPptUrl}
          />
        )}

      </div>

      {!project.pdf_path && !project.ppt_path && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No project documents uploaded yet.
        </div>
      )}

      {pdfUrl && (
        <div className="mt-6">
          <h3 className="mb-3 font-semibold">PDF Preview</h3>

          <iframe
            src={pdfUrl}
            title="Project PDF"
            className="h-[700px] w-full rounded-lg border"
          />
        </div>
      )}

      {pptUrl && (
        <div className="mt-4">
          <Button asChild variant="outline">
            <a
              href={pptUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open PPT
            </a>
          </Button>
        </div>
      )}
    </div>
  ) : accessStatus === "pending" ? (
    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-5">
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5" />
        <div>
          <h3 className="font-semibold">Access Request Pending</h3>
          <p className="text-sm text-muted-foreground">
            The project owner has not approved your request yet.
          </p>
        </div>
      </div>
    </div>
  ) : accessStatus === "rejected" ? (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5" />
        <div>
          <h3 className="font-semibold">Access Rejected</h3>
          <p className="text-sm text-muted-foreground">
            Your request to access these documents was rejected.
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span className="text-sm">
          Documents are NDA-protected. Request access to view.
        </span>
      </div>

      <Button
        className="mt-4"
        onClick={async () => {
          if (!user) return;

          const { data: existing } = await supabase
            .from("project_access_requests")
            .select("id,status")
            .eq("project_id", project.id)
            .eq("developer_id", user.id)
            .maybeSingle();

          if (existing) {
            setAccessStatus(existing.status);
            toast.info(`Request is already ${existing.status}.`);
            return;
          }

          const { error } = await supabase
            .from("project_access_requests")
            .insert({
              project_id: project.id,
              developer_id: user.id,
              status: "pending",
            });

          if (error) {
            console.error("REQUEST ACCESS ERROR:", error);
            toast.error(error.message);
            return;
          }

          setAccessStatus("pending");
          toast.success("Access request sent successfully!");
        }}
      >
        Request Access
      </Button>
    </div>
  )}
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
function DocumentCard({
  title,
  type,
  path,
  onUrl,
}: {
  title: string;
  type: "PDF" | "PPT";
  path: string;
  onUrl: (url: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const openDocument = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.storage
        .from("project-docs")
        .createSignedUrl(path, 3600);

      if (error) throw error;

      if (!data?.signedUrl) {
        throw new Error("Could not create document URL");
      }

      onUrl(data.signedUrl);

      if (type === "PPT") {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("DOCUMENT URL ERROR:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to open document"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="mb-4">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">
          NDA Protected • {type}
        </div>
      </div>

      <Button
        onClick={openDocument}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "View Document"
        )}
      </Button>
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
