import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dashboard } from "@/components/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import { isFounderEmail } from "@/lib/founders";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Founder Dashboard — Way To Dream" }] }),
  component: FounderGate,
});

function FounderGate() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (mounted) navigate({ to: "/auth" });
        return;
      }
      if (!isFounderEmail(session.user.email)) {
        toast.error("Unauthorized Access");
        await supabase.auth.signOut();
        if (mounted) navigate({ to: "/auth" });
        return;
      }
      if (mounted) setStatus("ok");
    })();
    return () => { mounted = false; };
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  return <Dashboard />;
}
