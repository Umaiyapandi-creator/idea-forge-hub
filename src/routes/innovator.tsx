import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, FileText, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/DashboardShell";
import { toast } from "sonner";

export const Route = createFileRoute("/innovator")({
  head: () => ({ meta: [{ title: "Innovator dashboard — Way to Dream" }] }),
  component: Page,
});

const PROJECTS = [
  { id: "smartfarm", title: "SmartFarm AI", stage: "Prototype", funding: "$50k", devs: 3, investors: 2 },
  { id: "medilink", title: "MediLink", stage: "Idea", funding: "$120k", devs: 0, investors: 5 },
];

function Page() {
  return (
    <DashboardShell
      title="My projects"
      subtitle="Manage your ideas, teams and investor requests"
      actions={
        <Link to="/project/new">
          <Button className="gap-2"><Plus className="h-4 w-4" /> Upload new idea</Button>
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p) => (
          <Link key={p.id} to="/project/$id" params={{ id: p.id }} className="group">
            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition group-hover:border-primary/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.title}</h3>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{p.stage}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Funding goal: {p.funding}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-muted p-2">
                  <Users className="mx-auto h-4 w-4 text-muted-foreground" />
                  <div className="mt-1 font-semibold">{p.devs}</div>
                  <div className="text-muted-foreground">devs</div>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <Briefcase className="mx-auto h-4 w-4 text-muted-foreground" />
                  <div className="mt-1 font-semibold">{p.investors}</div>
                  <div className="text-muted-foreground">VCs</div>
                </div>
                <div className="rounded-lg bg-muted p-2">
                  <FileText className="mx-auto h-4 w-4 text-muted-foreground" />
                  <div className="mt-1 font-semibold">3</div>
                  <div className="text-muted-foreground">docs</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        <button
          onClick={() => toast.info("Idea upload wizard coming soon")}
          className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 p-5 text-muted-foreground transition hover:border-primary hover:text-foreground"
        >
          <Plus className="h-6 w-6" />
          <span className="mt-2 text-sm font-medium">Upload new idea</span>
        </button>
      </div>
    </DashboardShell>
  );
}
