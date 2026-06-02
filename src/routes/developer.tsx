import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/DashboardShell";
import { toast } from "sonner";

export const Route = createFileRoute("/developer")({
  head: () => ({ meta: [{ title: "Developer portal — Way to Dream" }] }),
  component: Page,
});

const IDEAS = [
  { id: "smartfarm", title: "SmartFarm AI", industry: "AgriTech", stack: "React · Python · ML" },
  { id: "medilink", title: "MediLink", industry: "Healthcare", stack: "Next.js · Node · Postgres" },
  { id: "fintrack", title: "FinTrack", industry: "Fintech", stack: "React Native · Go" },
];

function Page() {
  return (
    <DashboardShell title="Discover projects" subtitle="Apply to collaborate with founders building real startups">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {IDEAS.map((i) => (
          <div key={i.id} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{i.title}</h3>
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{i.industry}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{i.stack}</p>
            <div className="mt-5 flex gap-2">
              <Link to="/project/$id" params={{ id: i.id }} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">View</Button>
              </Link>
              <Button size="sm" className="flex-1" onClick={() => toast.success("Access request sent")}>Request access</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
