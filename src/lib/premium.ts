import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Plan = "free" | "premium";

export function isPremiumActive(plan: string | null | undefined, expiresAt: string | null | undefined): boolean {
  if (plan !== "premium") return false;
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

export function usePlan(userId: string | undefined) {
  const [plan, setPlan] = useState<Plan>("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from("profiles").select("plan, plan_expires_at").eq("id", userId).maybeSingle();
    const p = (data?.plan as Plan) ?? "free";
    const exp = (data?.plan_expires_at as string | null) ?? null;
    setPlan(isPremiumActive(p, exp) ? "premium" : "free");
    setExpiresAt(exp);
    setLoading(false);
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [userId]);

  return { plan, isPremium: plan === "premium", expiresAt, loading, refresh };
}

export async function upgradeToPremium(userId: string, cycle: "monthly" | "yearly") {
  const now = new Date();
  const expires = new Date(now);
  if (cycle === "monthly") expires.setMonth(expires.getMonth() + 1);
  else expires.setFullYear(expires.getFullYear() + 1);
  const { error } = await supabase
    .from("profiles")
    .update({ plan: "premium", plan_expires_at: expires.toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export const PREMIUM_FREE_IDEA_LIMIT = 3;
