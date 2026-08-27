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

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
  requireRole,
}: Props) {
  const navigate = useNavigate();

  const { user, loading } = useAuth({
    redirectIfUnauthed: true,
    requireRole,
  });

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
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-muted/30">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur">

        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-3 sm:px-4 md:px-6">

          {/* LOGO */}
          <div className="shrink-0">
            <Logo size={32} />
          </div>

          {/* SEARCH - DESKTOP */}
          <form
            onSubmit={(e) => {
              e.preventDefault();

              navigate({
                to: "/search",
                search: { q },
              });
            }}
            className="relative hidden min-w-0 max-w-md flex-1 md:block"
          >
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people by name…"
              className="h-9 w-full pl-9"
            />
          </form>

          {/* RIGHT SIDE */}
          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">

            {/* USER INFO - DESKTOP */}
            <div className="hidden min-w-0 text-right text-sm md:block">
              <div className="max-w-[180px] truncate font-medium leading-tight">
                {user.name}
              </div>

              <div className="text-xs capitalize text-muted-foreground">
                {user.role}
              </div>
            </div>

            {/* LOGOUT */}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="shrink-0 gap-2 px-2 sm:px-3"
            >
              <LogOut className="h-4 w-4" />

              <span className="hidden xs:inline sm:inline">
                Log out
              </span>
            </Button>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        <div className="block w-full border-t border-border px-3 py-2 md:hidden">
          <form
            onSubmit={(e) => {
              e.preventDefault();

              navigate({
                to: "/search",
                search: { q },
              });
            }}
            className="relative w-full"
          >
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people by name…"
              className="h-10 w-full pl-9"
            />
          </form>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-3 py-5 sm:px-4 sm:py-6 md:px-6 md:py-8">

        {/* PAGE HEADER */}
        <div className="mb-5 flex w-full min-w-0 flex-col gap-4 sm:mb-6 md:mb-8 md:flex-row md:items-end md:justify-between">

          {/* TITLE */}
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-1 break-words text-sm text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {/* ACTION */}
          {actions && (
            <div className="w-full shrink-0 sm:w-auto">
              {actions}
            </div>
          )}
        </div>

        {/* PAGE CONTENT */}
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="w-full border-t border-border bg-background py-5 sm:py-6">

        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-3 text-center text-xs text-muted-foreground sm:px-4 sm:text-sm md:flex-row md:px-6 md:text-left">

          <div className="flex items-center gap-3">
            <Logo
              size={24}
              showText={false}
              to=""
            />

            <span>
              © {new Date().getFullYear()} Way to Dream
            </span>
          </div>

          <span>
            Protected by platform NDA
          </span>
        </div>
      </footer>
    </div>
  );
}
