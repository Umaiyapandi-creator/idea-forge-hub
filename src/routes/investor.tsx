import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/DashboardShell";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/investor")({
  head: () => ({ meta: [{ title: "Investor portal — Way to Dream" }] }),
  component: Page,
});

const STARTUPS = [
  { id: "smartfarm", title: "SmartFarm AI", category: "AI · AgriTech", funding: "$50k", stage: "Prototype", market: "$12B TAM" },
  { id: "medilink", title: "MediLink", category: "Healthcare", funding: "$120k", stage: "MVP", market: "$30B TAM" },
  { id: "fintrack", title: "FinTrack", category: "Fintech", funding: "$200k", stage: "Beta", market: "$45B TAM" },
];

function Page() {
  return (
    <DashboardShell title="Discover startups" subtitle="Browse vetted summaries. Full pitch decks require approval.">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STARTUPS.map((s) => (
          <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{s.title}</h3>
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{s.stage}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.category}</p>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Funding</dt><dd className="font-medium">{s.funding}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Market</dt><dd className="font-medium">{s.market}</dd></div>
            </dl>
            <div className="mt-5 flex gap-2">
              <Link to="/project/$id" params={{ id: s.id }} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">Summary</Button>
              </Link>
              <Button size="sm" className="flex-1 gap-1" onClick={() => toast.success("Pitch deck access requested")}>
                <Lock className="h-3 w-3" /> Request pitch
              </Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
