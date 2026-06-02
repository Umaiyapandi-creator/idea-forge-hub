import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/project/$id")({
  head: () => ({ meta: [{ title: "Project — Way to Dream" }] }),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const title = id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <DashboardShell
      title={title}
      subtitle="Project workspace"
      actions={<Link to="/innovator"><Button variant="outline" size="sm">← Back</Button></Link>}
    >
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">Public summary</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A short description of the project, its market opportunity, current prototype stage and funding needs.
            Visitors see this; protected docs require approval.
          </p>
        </TabsContent>
        <TabsContent value="docs" className="mt-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="text-sm">Documents are NDA-protected. Request access to view.</span>
          </div>
          <Button className="mt-4" onClick={() => toast.success("Access request sent to founder")}>Request access</Button>
        </TabsContent>
        <TabsContent value="team" className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No team members yet. Invite developers from the Developer portal.
        </TabsContent>
        <TabsContent value="investors" className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Pending investor requests will appear here.
        </TabsContent>
        <TabsContent value="progress" className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Milestones & tasks tracker coming soon.
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
