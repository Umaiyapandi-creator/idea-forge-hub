// Supabase-backed session helpers + React hook with role lookup.
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Role = "innovator" | "developer" | "investor" | "admin" | "founder";

export const FOUNDER_EMAILS = [
  "esakkimuthu01447@gmail.com",
  "founderofwaytodream@gmail.com",
];

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export function dashboardPathFor(role: Role): string {
  switch (role) {
    case "innovator": return "/innovator";
    case "developer": return "/developer";
    case "investor": return "/investor";
    case "admin":
    case "founder":
      return "/admin";
  }
}

async function loadUser(userId: string, email: string | undefined): Promise<SessionUser | null> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  // Prefer highest-privilege role if user has multiple
  const rolesList = (roles ?? []).map((r) => r.role as Role);
  const role: Role =
    rolesList.includes("founder") ? "founder" :
    rolesList.includes("admin") ? "admin" :
    (rolesList[0] ?? "innovator");
  return {
    id: userId,
    email: profile?.email ?? email ?? "",
    name: profile?.full_name ?? (email?.split("@")[0] ?? "User"),
    role,
  };
}

/** React hook: returns { user, loading }. Optionally redirects when unauthenticated. */
export function useAuth(options?: { redirectIfUnauthed?: boolean; requireRole?: Role }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        setUser(null);
        setLoading(false);
        if (options?.redirectIfUnauthed) navigate({ to: "/auth" });
      } else {
        setTimeout(async () => {
          const u = await loadUser(session.user.id, session.user.email);
          if (!mounted) return;
          setUser(u);
          setLoading(false);
          if (options?.requireRole && u && u.role !== options.requireRole && u.role !== "admin" && u.role !== "founder") {
            navigate({ to: dashboardPathFor(u.role) });
          }
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        setLoading(false);
        if (options?.redirectIfUnauthed) navigate({ to: "/auth" });
        return;
      }
      const u = await loadUser(session.user.id, session.user.email);
      if (!mounted) return;
      setUser(u);
      setLoading(false);
      if (options?.requireRole && u && u.role !== options.requireRole && u.role !== "admin" && u.role !== "founder") {
        navigate({ to: dashboardPathFor(u.role) });
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}
