import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Search as SearchIcon, Loader2, User as UserIcon, FileText } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const searchSchema = z.object({ q: z.string().catch("").default("") });

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search People — Way to Dream" }] }),
  validateSearch: (s) => searchSchema.parse(s),
  component: Page,
});

type Profile = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; industry: string | null };
type Project = { id: string; owner_id: string; name: string; industry: string | null; public_summary: string | null; status: string };

function Page() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [text, setText] = useState(q);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projectsByOwner, setProjectsByOwner] = useState<Record<string, Project[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { setText(q); }, [q]);

  useEffect(() => {
    if (!q.trim()) { setProfiles([]); setProjectsByOwner({}); return; }
    setLoading(true);
    (async () => {
      const term = `%${q.trim()}%`;
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name,email,avatar_url,industry")
        .or(`full_name.ilike.${term},email.ilike.${term}`)
        .limit(20);
      const list = (profs as Profile[]) ?? [];
      setProfiles(list);

      const ownerIds = list.map((p) => p.id);
      const grouped: Record<string, Project[]> = {};
      if (ownerIds.length) {
        const { data: projs } = await supabase
          .from("projects")
          .select("id,owner_id,name,industry,public_summary,status")
          .in("owner_id", ownerIds)
          .eq("status", "approved");
        for (const p of (projs as Project[]) ?? []) {
          (grouped[p.owner_id] ||= []).push(p);
        }
      }
      setProjectsByOwner(grouped);
      setLoading(false);
    })();
  }, [q]);

  return (
    <DashboardShell title="Search People" subtitle="Find innovators by name and see their profile and ideas">
      <form
        onSubmit={(e) => { e.preventDefault(); navigate({ search: { q: text } }); }}
        className="mb-6 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter a name…" className="pl-9" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !q.trim() ? (
        <p className="text-sm text-muted-foreground">Type a name above to find a person's profile and ideas.</p>
      ) : profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No people found for “{q}”.</p>
      ) : (
        <div className="space-y-6">
          {profiles.map((p) => {
            const ideas = projectsByOwner[p.id] ?? [];
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-primary/10 text-primary">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.full_name ?? "avatar"} className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold">{p.full_name ?? "Unnamed"}</div>
                    {p.email && <div className="truncate text-xs text-muted-foreground">{p.email}</div>}
                    {p.industry && <div className="text-xs text-muted-foreground">Industry: <span className="font-medium text-foreground">{p.industry}</span></div>}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Ideas ({ideas.length})</div>
                  {ideas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No public ideas yet.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ideas.map((r) => (
                        <Link
                          key={r.id}
                          to="/project/$id"
                          params={{ id: r.id }}
                          className="rounded-lg border border-border p-3 transition hover:border-primary"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate font-medium">{r.name}</div>
                            {r.industry && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">{r.industry}</span>
                            )}
                          </div>
                          {r.public_summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.public_summary}</p>}
                          <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary"><FileText className="h-3 w-3" /> Open →</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
