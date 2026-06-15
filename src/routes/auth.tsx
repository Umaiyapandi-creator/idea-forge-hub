import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Lightbulb, Code2, Briefcase, ShieldCheck, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { dashboardPathFor, type Role } from "@/lib/auth-store";
import { Logo } from "@/components/Logo";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional(),
  role: z.enum(["innovator", "developer", "investor"]).optional(),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login or Sign up — Way to Dream" },
      { name: "description", content: "Log in or create your Way to Dream account." },
    ],
  }),
  validateSearch: (s) => searchSchema.parse(s),
  component: AuthPage,
});

const TERMS = [
  "Users must provide accurate information during registration.",
  "Original creators retain ownership of their uploaded ideas and projects.",
  "Way to Dream receives a 40% equity or revenue share from successful projects.",
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
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", otp: "" });
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [otpSent, setOtpSent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [busy, setBusy] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    let mounted = true;
    const route = async (userId: string) => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const r = (roles?.[0]?.role as Role) ?? "innovator";
      if (mounted) navigate({ to: dashboardPathFor(r) });
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) route(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) route(session.user.id);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "signup" && !agreed) {
      toast.error("You must accept the Terms & NDA to continue");
      return;
    }
    setBusy(true);
    try {
      if (mode === "phone") {
        if (!form.phone) { toast.error("Enter your phone number"); return; }
        if (!otpSent) {
          const { error } = await supabase.auth.signInWithOtp({
            phone: form.phone,
            options: { data: { full_name: form.name || form.phone, role } },
          });
          if (error) throw error;
          setOtpSent(true);
          toast.success("OTP sent to your phone");
        } else {
          if (!form.otp) { toast.error("Enter the OTP"); return; }
          const { error } = await supabase.auth.verifyOtp({
            phone: form.phone,
            token: form.otp,
            type: "sms",
          });
          if (error) throw error;
          toast.success("Welcome!");
        }
      } else {
        if (!form.email || !form.password || (tab === "signup" && !form.name)) {
          toast.error("Please fill in all fields");
          return;
        }
        if (tab === "signup") {
          const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth`,
              data: { full_name: form.name, role },
            },
          });
          if (error) throw error;
          toast.success("Account created — welcome!");
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });
          if (error) throw error;
          toast.success("Welcome back");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <div className="container mx-auto grid min-h-screen items-center gap-8 px-6 py-10 lg:grid-cols-2">
        {/* Left brand panel */}
        <div className="hidden lg:block">
          <Logo size={44} to="" />
          <h1 className="mt-10 text-5xl font-bold tracking-tight">
            Way To <span className="text-primary">Dream</span>
          </h1>
          <p className="mt-2 text-sm font-medium tracking-widest text-muted-foreground">
            INNOVATE · INSPIRE · ACHIEVE
          </p>
          <p className="mt-6 max-w-md text-muted-foreground">
            One account to upload ideas, recruit a dev team, or invest in vetted startups — under a single NDA-backed roof.
          </p>
          <div className="mt-10 flex items-center gap-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">Passwords are encrypted. All projects are protected under platform NDA.</p>
          </div>
        </div>

        {/* Auth card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] md:p-8">
            <div className="mb-4 flex flex-col items-center gap-2 lg:hidden">
              <Logo size={40} to="" />
              <div className="text-center">
                <h2 className="text-2xl font-bold">Way To <span className="text-primary">Dream</span></h2>
                <p className="text-[11px] tracking-widest text-muted-foreground">INNOVATE · INSPIRE · ACHIEVE</p>
              </div>
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

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setMode("email"); setOtpSent(false); }}
                    className={`rounded-lg border p-2 text-xs font-medium transition ${mode === "email" ? "border-primary bg-primary/10" : "border-border bg-background text-muted-foreground"}`}>
                    Email
                  </button>
                  <button type="button" onClick={() => { setMode("phone"); setOtpSent(false); }}
                    className={`rounded-lg border p-2 text-xs font-medium transition ${mode === "phone" ? "border-primary bg-primary/10" : "border-border bg-background text-muted-foreground"}`}>
                    Phone
                  </button>
                </div>

                {mode === "email" ? (
                  <>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {tab === "login" && (
                          <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
                        )}
                      </div>
                      <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="phone">Mobile number</Label>
                      <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" disabled={otpSent} />
                      <p className="mt-1 text-[11px] text-muted-foreground">Include country code (e.g. +91).</p>
                    </div>
                    {otpSent && (
                      <div>
                        <Label htmlFor="otp">Enter OTP</Label>
                        <Input id="otp" inputMode="numeric" value={form.otp} onChange={(e) => setForm({ ...form, otp: e.target.value })} placeholder="6-digit code" />
                        <button type="button" onClick={() => setOtpSent(false)} className="mt-1 text-[11px] text-primary hover:underline">
                          Change number
                        </button>
                      </div>
                    )}
                  </>
                )}

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

                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "phone" ? (otpSent ? "Verify OTP" : "Send OTP") : tab === "login" ? "Log in" : "Create account"}
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
        </div>
      </div>
    </div>
  );
}
