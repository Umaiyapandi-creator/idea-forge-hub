import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Menu, LogOut, Loader2, Mail, Award, MessageSquare, User, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { signOut, useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";

import suryaCert from "@/assets/certs/surya.jpeg.asset.json";
import karthikeyanCert from "@/assets/certs/karthikeyan.jpeg.asset.json";
import umaiyaCert from "@/assets/certs/umaiya.jpeg.asset.json";
import mahaCert from "@/assets/certs/mahalakshmi.jpeg.asset.json";
import esakkiCert from "@/assets/certs/esakkimuthu.jpeg.asset.json";
import mareesCert from "@/assets/certs/mareeswaran.jpeg.asset.json";

// Replace with the Google Form URL when available
const APPLY_FORM_URL = "https://forms.gle/";

const DIRECTORS = [
  { name: "S. Surya", roll: "WTD_BOD-065", img: suryaCert.url },
  { name: "L. Karthikeyan", roll: "WTD_BOD-066", img: karthikeyanCert.url },
  { name: "B. Umaiya Pandi", roll: "WTD_TD-001", img: umaiyaCert.url },
  { name: "S. Maha Lakshmi", roll: "WTD_BOD-067", img: mahaCert.url },
];

const FOUNDERS = [
  { name: "K. EsakkiMuthu", roll: "WTD_FND-001", img: esakkiCert.url },
  { name: "L. Mareeswaran", roll: "WTD_CFND-001", img: mareesCert.url },
];

const CONTACT_EMAILS = ["esakkimuthu01447@gmail.com", "marees1422006@gmail.com"];

type Section = "profile" | "directors" | "feedback" | "founders" | "contact";

export function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth({ redirectIfUnauthed: true });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const [section, setSection] = useState<Section>("profile");
  const [industry, setIndustry] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("industry").eq("id", user.id).maybeSingle()
      .then(({ data }) => setIndustry(data?.industry ?? ""));
  }, [user]);

  const logout = async () => {
    await signOut();
    toast.success("Logged out");
    navigate({ to: "/auth" });
  };

  const saveIndustry = async (val: string) => {
    setIndustry(val);
    if (!user) return;
    await supabase.from("profiles").update({ industry: val }).eq("id", user.id);
  };

  const submitFeedback = async () => {
    if (!feedback.trim() || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, message: feedback.trim() });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setFeedback("");
    toast.success("Thanks for your feedback!");
  };

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const navItems: { id: Section; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "directors", label: "Directors", icon: Award },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "founders", label: "Founders", icon: Award },
    { id: "contact", label: "Contact", icon: Mail },
  ];

  const SidebarBody = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary text-xl font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="mt-2 font-semibold">{user.name}</div>
        <div className="text-xs text-muted-foreground">{industry || "Industry not set"}</div>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((n) => {
          const Icon = n.icon;
          const active = section === n.id;
          return (
            <button
              key={n.id}
              onClick={() => { setSection(n.id); setMenuOpen(false); }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" /> {n.label}
            </button>
          );
        })}
      </nav>
      <Button variant="outline" className="mt-auto gap-2" onClick={logout}>
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-20 items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
            <Logo size={40} showText={false} to="" />
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground sm:text-xl">
                Way To <span className="text-primary">Dream</span>
              </h1>
              <p className="text-[11px] tracking-wide text-muted-foreground sm:text-xs">
                Innovate · Inspire · Achieve
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="hidden gap-2 sm:flex">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </header>

      {/* Sidebar */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b border-border p-4">
            <SheetTitle>
              <Logo size={32} />
            </SheetTitle>
          </SheetHeader>
          {SidebarBody}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        {section === "profile" && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">Profile</h2>
            <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-semibold">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-1 text-xs capitalize text-primary">{user.role}</div>
                </div>
              </div>
              <div className="mt-6">
                <label className="mb-1 block text-sm font-medium">Industry</label>
                <Input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  onBlur={(e) => saveIndustry(e.target.value)}
                  placeholder="e.g. FinTech, AgriTech, Healthcare"
                />
              </div>
            </div>
          </section>
        )}

        {section === "directors" && (
          <CertGrid title="Directors" items={DIRECTORS} />
        )}

        {section === "founders" && (
          <CertGrid title="Founders" items={FOUNDERS} />
        )}

        {section === "feedback" && (
          <section className="max-w-2xl">
            <h2 className="mb-6 text-2xl font-bold">Feedback</h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium">Share your thoughts</label>
              <Textarea
                rows={6}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what's working and what we can improve..."
              />
              <Button className="mt-4" onClick={submitFeedback} disabled={submitting || !feedback.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit feedback"}
              </Button>
            </div>
          </section>
        )}

        {section === "contact" && (
          <section className="max-w-xl">
            <h2 className="mb-6 text-2xl font-bold">Contact Details</h2>
            <div className="space-y-3">
              {CONTACT_EMAILS.map((e) => (
                <a
                  key={e}
                  href={`mailto:${e}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Email</div>
                    <div className="font-medium">{e}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <Logo size={28} />
          <span>© {new Date().getFullYear()} Way To Dream · Innovate · Inspire · Achieve</span>
        </div>
      </footer>

      {/* Apply popup */}
      <Dialog open={showAd} onOpenChange={setShowAd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">APPLY FOR CERTIFICATE</DialogTitle>
            <DialogDescription className="text-base text-foreground/80">
              Applications are open now. Certificates will be issued after 30 days. Apply today.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setShowAd(false)}>Later</Button>
            <Button asChild>
              <a href={APPLY_FORM_URL} target="_blank" rel="noopener noreferrer" onClick={() => setShowAd(false)}>
                Apply Now
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CertGrid({ title, items }: { title: string; items: { name: string; roll: string; img: string }[] }) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((c) => (
          <div key={c.name} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-lg">
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img src={c.img} alt={`${c.name} certificate`} className="h-full w-full object-cover" />
            </div>
            <div className="p-4 text-center">
              <div className="text-base font-bold text-foreground">{c.name}</div>
              <div className="mt-1 text-sm font-semibold text-primary">{c.roll}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
