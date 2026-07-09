import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ q: fallback(z.string(), "").default("") });

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — Way to Dream" }] }),
  validateSearch: zodValidator(searchSchema),
  component: Page,
});

type Row = { id: string; name: string; industry: string | null; public_summary: string | null; status: string };

function Page() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [text, setText] = useState(q);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setText(q); }, [q]);

  useEffect(() => {
    if (!q.trim()) { setRows([]); return; }
    setLoading(true);
    (async () => {
      const term = `%${q.trim()}%`;
      const { data } = await supabase.from("projects")
        .select("id,name,industry,public_summary,status")
        .eq("status", "approved")
        .or(`name.ilike.${term},industry.ilike.${term},public_summary.ilike.${term}`)
        .limit(40);
      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, [q]);

  return (
    <DashboardShell title="Search Projects" subtitle="Find ideas by name, industry, or summary">
      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: text } }); }}
        className="mb-6 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search projects…" className="pl-9" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !q.trim() ? (
        <p className="text-sm text-muted-foreground">Type a query above to find approved projects.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No results for “{q}”.</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Link key={r.id} to="/project/$id" params={{ id: r.id }} className="rounded-xl border border-border bg-card p-4 transition hover:border-primary">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.name}</div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{r.industry ?? "—"}</span>
              </div>
              {r.public_summary && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.public_summary}</p>}
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
