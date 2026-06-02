import { Link, useNavigate } from "@tanstack/react-router";
import { Rocket, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, getSession } from "@/lib/auth-store";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ title, subtitle, actions, children }: Props) {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate({ to: "/auth" });
    } else {
      setUser({ name: s.name, role: s.role });
    }
  }, [navigate]);

  const logout = () => {
    clearSession();
    toast.success("Logged out");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundImage: "var(--gradient-hero)" }}>
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Way to Dream</span>
          </Link>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden text-right text-sm md:block">
                <div className="font-medium leading-tight">{user.name}</div>
                <div className="text-xs capitalize text-muted-foreground">{user.role}</div>
              </div>
            )}
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
    </div>
  );
}
