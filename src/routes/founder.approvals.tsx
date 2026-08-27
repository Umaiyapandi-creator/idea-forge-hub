import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Loader2,
  Check,
  X,
  Image as ImageIcon,
  ExternalLink,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/DashboardShell";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/founder/approvals")({
  head: () => ({
    meta: [{ title: "Founder Approvals — Way To Dream" }],
  }),
  component: Page,
});

type PReq = {
  id: string;
  user_id: string;
  cycle: "quarterly" | "yearly";
  amount: number;
  screenshot_path: string;
  status: string;
  created_at: string;
};

type Proj = {
  id: string;
  name: string;
  owner_id: string;
  industry: string | null;
  status: string;
  created_at: string;
  public_summary: string | null;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
};

function Page() {
  const navigate = useNavigate();

  const { user, loading } = useAuth({
    redirectIfUnauthed: true,
  });

  const [preqs, setPreqs] = useState<PReq[]>([]);
  const [projects, setProjects] = useState<Proj[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    if (user.role !== "founder" && user.role !== "admin") {
      toast.error("Founder access only");
      navigate({ to: "/auth" });
    }
  }, [user, navigate]);

  const load = async () => {
    const [
      { data: pr, error: prError },
      { data: pj, error: pjError },
      { data: us, error: usError },
    ] = await Promise.all([
      supabase
        .from("premium_requests")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("projects")
        .select(
          "id,name,owner_id,industry,status,created_at,public_summary"
        )
        .order("created_at", { ascending: false }),

      supabase
        .from("profiles")
        .select(
          "id,full_name,email,approval_status,created_at"
        )
        .order("created_at", { ascending: false }),
    ]);

    if (prError) {
      console.error("Premium load error:", prError);
    }

    if (pjError) {
      console.error("Project load error:", pjError);
    }

    if (usError) {
      console.error("Users load error:", usError);
      toast.error("Unable to load users");
    }

    setPreqs((pr as PReq[]) ?? []);
    setProjects((pj as Proj[]) ?? []);
    setUsers((us as UserProfile[]) ?? []);
  };

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  const signedUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("payment-screenshots")
      .createSignedUrl(path, 300);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data?.signedUrl) {
      window.open(
        data.signedUrl,
        "_blank",
        "noopener"
      );
    }
  };

  // USER APPROVE / REJECT
  const decideUser = async (
    u: UserProfile,
    next: "approved" | "rejected"
  ) => {
    setBusy(u.id);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: next,
        })
        .eq("id", u.id);

      if (error) {
        throw error;
      }

      toast.success(
        next === "approved"
          ? `${u.email} approved`
          : `${u.email} rejected`
      );

      await load();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Failed to update user"
      );
    } finally {
      setBusy(null);
    }
  };

  // PREMIUM APPROVE / REJECT
  const decidePremium = async (
    r: PReq,
    approve: boolean
  ) => {
    setBusy(r.id);

    try {
      const { error } = await supabase
        .from("premium_requests")
        .update({
          status: approve ? "approved" : "rejected",
        })
        .eq("id", r.id);

      if (error) {
        throw error;
      }

      if (approve) {
        const exp = new Date();

        if (r.cycle === "quarterly") {
          exp.setMonth(exp.getMonth() + 3);
        } else {
          exp.setFullYear(exp.getFullYear() + 1);
        }

        const { error: pe } = await supabase
          .from("profiles")
          .update({
            plan: "premium",
            plan_expires_at: exp.toISOString(),
          })
          .eq("id", r.user_id);

        if (pe) {
          throw pe;
        }
      }

      toast.success(
        approve ? "Premium activated" : "Rejected"
      );

      await load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed"
      );
    } finally {
      setBusy(null);
    }
  };

  // PROJECT APPROVE / REJECT
  const decideProject = async (
    p: Proj,
    next: "approved" | "rejected"
  ) => {
    setBusy(p.id);

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          status: next,
        })
        .eq("id", p.id);

      if (error) {
        throw error;
      }

      toast.success(`Project ${next}`);

      await load();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Failed"
      );
    } finally {
      setBusy(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pendingUsers = users.filter(
    (u) => u.approval_status === "pending"
  );

  const pendingPremium = preqs.filter(
    (r) => r.status === "pending"
  );

  const pendingProjects = projects.filter(
    (p) => p.status === "pending"
  );

  return (
    <DashboardShell
      title="Founder Approvals"
      subtitle="Review users, premium payments and project submissions"
      actions={
        <Link to="/admin">
          <Button variant="outline" size="sm">
            ← Dashboard
          </Button>
        </Link>
      }
    >
      <Tabs defaultValue="users">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="users">
            <Users className="mr-1 h-4 w-4" />
            Users ({pendingUsers.length})
          </TabsTrigger>

          <TabsTrigger value="premium">
            Premium ({pendingPremium.length})
          </TabsTrigger>

          <TabsTrigger value="projects">
            Projects ({pendingProjects.length})
          </TabsTrigger>
        </TabsList>

        {/* USERS */}
        <TabsContent
          value="users"
          className="mt-4 space-y-3"
        >
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No users yet.
            </p>
          )}

          {users.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">
                    {u.full_name || "Unnamed user"}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {u.email}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Joined{" "}
                    {new Date(
                      u.created_at
                    ).toLocaleString()}
                  </div>
                </div>

                <div className="flex w-full gap-2 sm:w-auto">
                  {u.approval_status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          decideUser(u, "approved")
                        }
                        disabled={busy === u.id}
                        className="gap-1"
                      >
                        {busy === u.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          decideUser(u, "rejected")
                        }
                        disabled={busy === u.id}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-1 text-xs uppercase ${
                        u.approval_status === "approved"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {u.approval_status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* PREMIUM */}
        <TabsContent
          value="premium"
          className="mt-4 space-y-3"
        >
          {preqs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No requests yet.
            </p>
          )}

          {preqs.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">
                    ₹{r.amount} — {r.cycle}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    User {r.user_id.slice(0, 8)} ·{" "}
                    {new Date(
                      r.created_at
                    ).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      signedUrl(r.screenshot_path)
                    }
                    className="gap-1"
                  >
                    <ImageIcon className="h-3 w-3" />
                    View proof
                  </Button>

                  {r.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          decidePremium(r, true)
                        }
                        disabled={busy === r.id}
                        className="gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          decidePremium(r, false)
                        }
                        disabled={busy === r.id}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <span className="rounded-full px-2 py-1 text-xs uppercase">
                      {r.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* PROJECTS */}
        <TabsContent
          value="projects"
          className="mt-4 space-y-3"
        >
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No projects yet.
            </p>
          )}

          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {p.name}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {p.industry ?? "—"} ·{" "}
                    {new Date(
                      p.created_at
                    ).toLocaleString()}
                  </div>

                  {p.public_summary && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {p.public_summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/project/$id"
                    params={{ id: p.id }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open
                    </Button>
                  </Link>

                  {p.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          decideProject(
                            p,
                            "approved"
                          )
                        }
                        disabled={busy === p.id}
                        className="gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          decideProject(
                            p,
                            "rejected"
                          )
                        }
                        disabled={busy === p.id}
                        className="gap-1"
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <span className="rounded-full px-2 py-1 text-xs uppercase">
                      {p.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
