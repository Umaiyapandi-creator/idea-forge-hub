import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

type Msg = { id: string; user_id: string; message: string; created_at: string };

export function ProjectChat({ projectId, userId }: { projectId: string; userId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("project_messages")
        .select("id,user_id,message,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (!mounted) return;
      if (error) toast.error(error.message);
      else setMessages((data as Msg[]) ?? []);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`pm-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "project_messages", filter: `project_id=eq.${projectId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Msg]),
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [projectId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    const { error } = await supabase.from("project_messages").insert({
      project_id: projectId, user_id: userId, message: body,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
  };

  return (
    <div className="flex h-[420px] flex-col rounded-lg border border-border">
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <div className="grid h-full place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">No messages yet — say hi 👋</p>
        ) : messages.map((m) => {
          const mine = m.user_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div>{m.message}</div>
                <div className={`mt-0.5 text-[10px] opacity-70`}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-center gap-2 border-t border-border p-2"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
        <Button type="submit" size="icon" disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
