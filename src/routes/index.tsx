import { createFileRoute, Link } from "@tanstack/react-router";
import { Rocket, Shield, Users, TrendingUp, Lightbulb, Code2, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Way to Dream — Where ideas become startups" },
      { name: "description", content: "A protected ecosystem for innovators, developers and investors to build the next generation of startups together." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundImage: "var(--gradient-hero)" }}>
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Way to Dream</span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/auth" search={{ tab: "signup" }}><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-30" style={{ backgroundImage: "var(--gradient-hero)" }} />
        <div className="container mx-auto px-6 py-24 text-center md:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Shield className="h-3 w-3" /> Idea-protected platform
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Where bold ideas find{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-hero)" }}>
              builders & backers
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Upload your idea privately, recruit developers with NDA-protected access, and pitch to investors — all in one trusted ecosystem.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ tab: "signup", role: "innovator" }}>
              <Button size="lg" className="gap-2"><Lightbulb className="h-4 w-4" /> Upload Idea</Button>
            </Link>
            <Link to="/auth" search={{ tab: "signup", role: "developer" }}>
              <Button size="lg" variant="outline" className="gap-2"><Code2 className="h-4 w-4" /> Join as Developer</Button>
            </Link>
            <Link to="/auth" search={{ tab: "signup", role: "investor" }}>
              <Button size="lg" variant="outline" className="gap-2"><Briefcase className="h-4 w-4" /> Investor Portal</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container mx-auto px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">How it works</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            { icon: Lightbulb, title: "1. Submit your idea", desc: "Upload pitch decks and prototypes with granular visibility controls." },
            { icon: Users, title: "2. Build your team", desc: "Approve developers to access protected docs under NDA." },
            { icon: TrendingUp, title: "3. Raise & grow", desc: "Investors request access — you control who sees what." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-muted/40 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Built for trust</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Access control", desc: "Public preview vs NDA-gated documents." },
              { title: "Request workflow", desc: "Investors must request — never auto-download." },
              { title: "Project tracking", desc: "Milestones, tasks and team chat in one place." },
              { title: "Admin moderation", desc: "Fraud detection and NDA verification." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to start?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Join Way to Dream and turn your idea into a funded startup.</p>
        <Link to="/auth" search={{ tab: "signup" }} className="mt-8 inline-block">
          <Button size="lg">Create your account</Button>
        </Link>
      </section>

      <footer id="terms" className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Way to Dream. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/auth" className="hover:text-foreground">Login</Link>
            <a href="#terms" className="hover:text-foreground">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
