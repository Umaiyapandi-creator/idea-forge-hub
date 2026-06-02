import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/DashboardShell";
import { toast } from "sonner";
import { Users, FolderKanban, ShieldCheck, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin panel — Way to Dream" }] }),
  component: Page,
});

const STATS = [
  { label: "Total users", value: "1,284", icon: Users },
  { label: "Active startups", value: "94", icon: FolderKanban },
  { label: "NDAs signed", value: "412", icon: ShieldCheck },
  { label: "Open reports", value: "7", icon: AlertTriangle },
];

const QUEUE = [
  { id: 1, type: "Project upload", who: "SmartFarm AI by Jane D." },
  { id: 2, type: "NDA verification", who: "Acme Ventures" },
  { id: 3, type: "Fraud report", who: "user_4827" },
];

function Page() {
  return (
    <DashboardShell title="Admin panel" subtitle="Moderation, verification & analytics">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 className="font-semibold">Moderation queue</h2>
        </div>
        <ul className="divide-y divide-border">
          {QUEUE.map((q) => (
            <li key={q.id} className="flex items-center justify-between p-5">
              <div>
                <div className="text-sm font-medium">{q.type}</div>
                <div className="text-xs text-muted-foreground">{q.who}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toast.error("Rejected")}>Reject</Button>
                <Button size="sm" onClick={() => toast.success("Approved")}>Approve</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardShell>
  );
}
