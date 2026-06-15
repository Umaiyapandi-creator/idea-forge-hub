import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Menu, LogOut, Loader2, Mail, Award, MessageSquare, User, Camera, FolderKanban, Plus, FileText } from "lucide-react";
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
import periyaCert from "@/assets/certs/periyanayagam.jpeg.asset.json";
import esakkiCert from "@/assets/certs/esakkimuthu.jpeg.asset.json";
import mareesCert from "@/assets/certs/mareeswaran.jpeg.asset.json";

const APPLY_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSc91HEo9eq0iPOU3t9RtKxksarjovfJVdGGai1dMC2z92kvEA/viewform?usp=header";

const DIRECTORS = [
  { name: "L. Karthikeyan", roll: "Board of Director", img: karthikeyanCert.url },
  { name: "S. Maha Lakshmi", roll: "Board of Director", img: mahaCert.url },
  { name: "S. Surya", roll: "Board of Director", img: suryaCert.url },
  { name: "P. Periyanayagam", roll: "Board of Director", img: periyaCert.url },
  { name: "B. Umaiya Pandi", roll: "Technical Director", img: umaiyaCert.url },
];

const FOUNDERS = [
  { name: "K. EsakkiMuthu", roll: "Founder", img: esakkiCert.url },
  { name: "L. Mareeswaran", roll: "Co-Founder", img: mareesCert.url },
];

const CONTACTS = [
  { title: "Founder", email: "founder@waytodream.sbs" },
  { title: "Co-Founder", email: "cofounderwaytodream@gmail.com" },
  { title: "Customer Service", email: "careofwaytodream@gmail.com" },
];

type Section = "profile" | "projects" | "directors" | "feedback" | "founders" | "contact";

type ProjectRow = {
  id: string;
  name: string;
  industry: string | null;
  funding_needed: string | null;
  status: string;
  owner_id: string;
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth({ redirectIfUnauthed: true });
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const [section, setSection] = useState<Section>("profile");
  const [industry, setIndustry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewer, setViewer] = useState<{ src: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("industry, avatar_url").eq("id", user.id).maybeSingle()
      .then(async ({ data }) => {
        setIndustry(data?.industry ?? "");
        const path = data?.avatar_url ?? null;
        setAvatarPath(path);
        if (path) {
          const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
          if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
        }
      });
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

  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please pick an image"); return; }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
      if (updErr) throw updErr;
      if (avatarPath) await supabase.storage.from("avatars").remove([avatarPath]);
      const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      setAvatarPath(path);
      setAvatarUrl(signed?.signedUrl ?? null);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
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
    { id: "founders", label: "Founders", icon: Award },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "contact", label: "Contact", icon: Mail },
  ];

  const AvatarCircle = ({ size = 64, clickable = false }: { size?: number; clickable?: boolean }) => (
    <button
      type="button"
      onClick={clickable ? onPickAvatar : undefined}
      disabled={!clickable || uploadingAvatar}
      className={`relative grid place-items-center overflow-hidden rounded-full bg-primary/10 text-primary font-bold ${clickable ? "cursor-pointer ring-2 ring-transparent hover:ring-primary/40" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label={clickable ? "Change profile picture" : undefined}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <span>{user.name.charAt(0).toUpperCase()}</span>
      )}
      {clickable && (
        <span className="absolute inset-x-0 bottom-0 flex h-1/3 items-center justify-center bg-black/50 text-white">
          {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        </span>
      )}
    </button>
  );

  const SidebarBody = (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <div className="mx-auto h-16 w-16">
          <AvatarCircle size={64} />
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
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarChange} />

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
          <div className="flex items-center gap-2">
            <div className="hidden sm:block"><AvatarCircle size={36} /></div>
            <Button variant="ghost" size="sm" onClick={logout} className="hidden gap-2 sm:flex">
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </header>

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

      <main className="container mx-auto px-4 py-8">
        {section === "profile" && (
          <section>
            <h2 className="mb-6 text-2xl font-bold">Profile</h2>
            <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <AvatarCircle size={80} clickable />
                <div>
                  <div className="text-lg font-semibold">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="mt-1 text-xs capitalize text-primary">{user.role}</div>
                  {industry && <div className="mt-1 text-xs text-muted-foreground">Industry: <span className="font-medium text-foreground">{industry}</span></div>}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Tap the photo to change your profile picture.</p>
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

        {section === "directors" && <CertGrid title="Directors" items={DIRECTORS} onOpen={setViewer} />}
        {section === "founders" && <CertGrid title="Founders" items={FOUNDERS} onOpen={setViewer} />}

        {section === "feedback" && (
          <section className="max-w-2xl">
            <h2 className="mb-6 text-2xl font-bold">Feedback</h2>
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <label className="mb-2 block text-sm font-medium">Share your thoughts</label>
              <Textarea rows={6} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tell us what's working and what we can improve..." />
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
              {CONTACTS.map((c) => (
                <a
                  key={c.email}
                  href={`mailto:${c.email}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-primary"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">{c.title}</div>
                    <div className="font-medium text-foreground">{c.email}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border bg-background py-6">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <Logo size={28} />
          <span>© {new Date().getFullYear()} Way To Dream · Innovate · Inspire · Achieve</span>
        </div>
      </footer>

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

      {/* Certificate viewer */}
      <Dialog open={!!viewer} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="max-w-5xl p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{viewer?.name}</DialogTitle>
          </DialogHeader>
          {viewer && (
            <div className="overflow-auto">
              <img src={viewer.src} alt={viewer.name} className="mx-auto h-auto max-h-[80vh] w-full object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CertGrid({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: { name: string; roll: string; img: string }[];
  onOpen: (v: { src: string; name: string }) => void;
}) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => onOpen({ src: c.img, name: c.name })}
            className="group overflow-hidden rounded-xl border border-border bg-card text-left shadow-sm transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="aspect-[16/10] overflow-hidden bg-muted">
              <img src={c.img} alt={`${c.name} certificate`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
            </div>
            <div className="p-4 text-center">
              <div className="text-base font-bold text-foreground">{c.name}</div>
              <div className="mt-1 text-sm font-semibold text-primary">{c.roll}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Click to view certificate</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
