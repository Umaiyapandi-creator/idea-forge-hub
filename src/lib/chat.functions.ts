import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      messages: z.array(messageSchema).min(1).max(40),
    }),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "AI service is not configured yet.", error: "missing_key" as const };
    }

    const systemPrompt = {
      role: "system" as const,
      content:
        "You are the friendly assistant for Way to Dream, a platform connecting innovators, developers, and investors. " +
        "Help users navigate the platform, explain features (idea uploads, NDA-protected docs, investor requests, dashboards), " +
        "and answer questions about getting started. Keep replies concise (2-4 sentences).",
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemPrompt, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, text);
      return { reply: "Sorry, I couldn't reach the AI service. Please try again.", error: "gateway_error" as const };
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const reply = json.choices?.[0]?.message?.content ?? "I didn't catch that. Could you rephrase?";
    return { reply };
  });
