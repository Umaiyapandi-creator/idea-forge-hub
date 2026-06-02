import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Rocket, Lightbulb, Code2, Briefcase, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { setSession, dashboardPathFor, type Role } from "@/lib/auth-store";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional(),
  role: z.enum(["innovator", "developer", "investor"]).optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or sign up — Way to Dream" },
      { name: "description", content: "Log in or create your Way to Dream account as an innovator, developer or investor." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

const TERMS = [
  "Users must provide accurate information during registration.",
  "Original creators retain ownership of their uploaded ideas and projects.",
  "Way to Dream receives a 15% equity or revenue share from successful projects.",
  "Users must not copy, steal, or misuse other users' ideas.",
  "All uploaded files and project details are protected under platform policies.",
  "Developers and collaborators must follow NDA and confidentiality rules.",
  "Illegal, harmful, or fake content is strictly prohibited on the platform.",
  "Investors and collaborators use the platform at their own business risk.",
  "Way to Dream reserves the right to approve, reject, or remove any project.",
  "By using the platform, users agree to all Terms, Privacy Policy, and NDA rules.",
];

const ROLES: { value: Role; label: string; icon: typeof Lightbulb; desc: string }[] = [
  { value: "innovator", label: "Innovator", icon: Lightbulb, desc: "Upload & protect your ideas" },
  { value: "developer", label: "Developer", icon: Code2, desc: "Build prototypes with founders" },
  { value: "investor", label: "Investor", icon: Briefcase, desc: "Discover & back startups" },
];

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">(search.tab ?? "login");
  const [role, setRole] = useState<Role>(search.role ?? "innovator");
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showTerms, setShowTerms] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || (tab === "signup" && !form.name)) {
      toast.error("Please fill in all fields");
      return;
    }
    if (tab === "signup" && !agreed) {
      toast.error("You must accept the Terms & NDA to continue");
      return;
    }
    setSession({
      name: form.name || form.email.split("@")[0],
      email: form.email,
      role,
    });
    toast.success(tab === "signup" ? "Account created" : "Welcome back");
    navigate({ to: dashboardPathFor(role) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <div className="container mx-auto grid min-h-screen items-center gap-8 px-6 py-10 lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="hidden lg:block">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ backgroundImage: "var(--gradient-hero)" }}>
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Way to Dream</span>
          </Link>
          <h1 className="mt-12 text-4xl font-bold tracking-tight">
            Your ideas,{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>protected</span>.
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            One account to upload ideas, recruit a dev team, or invest in vetted startups — under a single NDA-backed roof.
          </p>
          <div className="mt-10 flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">All projects are protected under platform NDA & moderation policies.</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] md:p-8">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundImage: "var(--gradient-hero)" }}>
                  <Rocket className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Way to Dream</span>
              </Link>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                  <Label className="mb-2 block">I am a</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const active = role === r.value;
                      return (
                        <button
                          type="button"
                          key={r.value}
                          onClick={() => setRole(r.value)}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs transition ${
                            active
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-background hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{ROLES.find((r) => r.value === role)?.desc}</p>
                </div>

                <TabsContent value="signup" className="mt-0 space-y-4 p-0">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
                  </div>
                </TabsContent>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                </div>

                <TabsContent value="signup" className="mt-0 p-0">
                  <div className="rounded-lg border border-border bg-muted/40 p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-0.5" />
                      <Label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                        I have read and agree to the{" "}
                        <button type="button" onClick={() => setShowTerms((v) => !v)} className="font-medium text-primary underline-offset-2 hover:underline">
                          Terms, Privacy Policy & NDA
                        </button>
                        .
                      </Label>
                    </div>
                    {showTerms && (
                      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-muted-foreground">
                        {TERMS.map((t) => <li key={t}>{t}</li>)}
                      </ol>
                    )}
                  </div>
                </TabsContent>

                <Button type="submit" className="w-full" size="lg">
                  {tab === "login" ? "Log in" : "Create account"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  {tab === "login" ? (
                    <>Don't have an account?{" "}
                      <button type="button" className="font-medium text-primary hover:underline" onClick={() => setTab("signup")}>Sign up</button>
                    </>
                  ) : (
                    <>Already a member?{" "}
                      <button type="button" className="font-medium text-primary hover:underline" onClick={() => setTab("login")}>Log in</button>
                    </>
                  )}
                </p>
              </form>
            </Tabs>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
