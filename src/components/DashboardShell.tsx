import { useNavigate } from "@tanstack/react-router";
import { LogOut, Loader2, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut, useAuth, type Role } from "@/lib/auth-store";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  requireRole?: Role;
}

export function DashboardShell({ title, subtitle, actions, children, requireRole }: Props) {
  const navigate = useNavigate();
  const { user, loading } = useAuth({ redirectIfUnauthed: true, requireRole });
  const [q, setQ] = useState("");

  const logout = async () => {
    await signOut();
    toast.success("Logged out");
    navigate({ to: "/auth" });
  };

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-6">
          <Logo size={32} />
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/search", search: { q } }); }}
            className="relative hidden max-w-md flex-1 md:block"
          >
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people by name…" className="pl-9" />
          </form>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm md:block">
              <div className="font-medium leading-tight">{user.name}</div>
              <div className="text-xs capitalize text-muted-foreground">{user.role}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
      <footer className="border-t border-border bg-background py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-3">
            <Logo size={24} showText={false} to="" />
            <span>© {new Date().getFullYear()} Way to Dream</span>
          </div>
          <span>Protected by platform NDA</span>
        </div>
      </footer>
    </div>
  );
}
