import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  projectId: z.string().uuid(),
  name: z.string(),
  problem: z.string(),
  solution: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
});

export type AiAnalysis = {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  market_potential?: number;
  innovation?: number;
  startup_readiness?: number;
  raw?: string;
};

export const analyzeProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => Input.parse(v))
  .handler(async ({ data, context }): Promise<AiAnalysis> => {
    const { supabase, userId } = context;

    const { data: proj } = await supabase
      .from("projects")
      .select("owner_id")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!proj || proj.owner_id !== userId) throw new Error("Forbidden");

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .maybeSingle();
    const plan = profile?.plan;
    const exp = profile?.plan_expires_at;
    const active = plan === "premium" && (!exp || new Date(exp).getTime() > Date.now());
    if (!active) throw new Error("Premium required");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const prompt = `You are a startup analyst. Analyze this project and return a strict JSON object with keys: summary (string, 2-3 sentences), strengths (array of 3-5 short strings), improvements (array of 3-5 short strings), market_potential (integer 0-100), innovation (integer 0-100), startup_readiness (integer 0-100).

Project name: ${data.name}
Industry: ${data.industry ?? "N/A"}
Problem: ${data.problem}
Solution: ${data.solution ?? "N/A"}

Return ONLY the JSON object, no prose, no markdown.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI request failed [${res.status}]: ${t}`);
    }
    const body = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content: string = body.choices?.[0]?.message?.content ?? "{}";
    let analysis: AiAnalysis;
    try { analysis = JSON.parse(content) as AiAnalysis; } catch { analysis = { raw: content }; }

    await supabase
      .from("projects")
      .update({ ai_analysis: analysis as unknown as never })
      .eq("id", data.projectId);

    return analysis;
  });
