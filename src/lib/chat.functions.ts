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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        reply: "AI service is not configured yet.",
        error: "missing_key" as const,
      };
    }

    const systemPrompt =
      "You are the friendly AI assistant for Way to Dream, a platform " +
      "connecting innovators, developers, and investors. " +
      "Help users navigate the platform, explain features such as idea uploads, " +
      "NDA-protected documents, developer access requests, investor requests, " +
      "dashboards, profiles, and project management. " +
      "Keep replies concise, friendly, and easy to understand.";

    try {
      const contents = [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        ...data.messages
          .filter((message) => message.role !== "system")
          .map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
      ];

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-latest:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents,
          }),
        },
      );

      if (!res.ok) {
  const errorText = await res.text().catch(() => "");

  console.error("GEMINI API ERROR STATUS:", res.status);
  console.error("GEMINI API ERROR BODY:", errorText);

  return {
    reply: `Gemini API error (${res.status}). Please check the server logs.`,
    error: "gateway_error" as const,
  };
}
      const json = (await res.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string;
            }>;
          };
        }>;
      };

      const reply =
        json.candidates?.[0]?.content?.parts?.[0]?.text ??
        "I didn't catch that. Could you rephrase?";

      return { reply };
    } catch (error) {
      console.error("Gemini request failed:", error);

      return {
        reply:
          "Something went wrong while connecting to the AI service.",
        error: "request_failed" as const,
      };
    }
  });
