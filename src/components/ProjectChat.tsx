
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

type Msg = {
  id: string;
  project_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
};

type ProjectChatProps = {
  projectId: string;
  userId: string;
  ownerId: string;
};

export function ProjectChat({
  projectId,
  userId,
  ownerId,
}: ProjectChatProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] =
  useState<string | null>(null);
const isOwner = userId === ownerId;

useEffect(() => {
  const loadChatReceiver = async () => {
    // Developer → Innovator
    if (!isOwner) {
      setSelectedDeveloper(ownerId);
      return;
    }

    // Innovator → Approved Developer
    const { data, error } = await supabase
      .from("project_access_requests")
      .select("developer_id")
      .eq("project_id", projectId)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("CHAT RECEIVER ERROR:", error);
      return;
    }

    setSelectedDeveloper(data?.developer_id ?? null);
  };

  loadChatReceiver();
}, [projectId, userId, ownerId, isOwner]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages
  useEffect(() => {
    let mounted = true;

    const loadMessages = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("project_messages")
        .select(
          "id,project_id,sender_id,receiver_id,message,created_at"
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (!mounted) return;

      if (error) {
        console.error("CHAT LOAD ERROR:", error);
        toast.error(error.message);
      } else {
        setMessages((data as Msg[]) ?? []);
      }

      setLoading(false);
    };

    loadMessages();

    // Realtime
    const channel = supabase
      .channel(`project-chat-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMessage = payload.new as Msg;

          setMessages((current) => {
            // Prevent duplicate message
            if (current.some((m) => m.id === newMessage.id)) {
              return current;
            }

            return [...current, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  // Auto scroll
  useEffect(() => {
    const element = scrollRef.current;

    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Send message
  const send = async () => {
  const body = text.trim();

  if (!body || sending) return;

  if (!selectedDeveloper) {
    toast.error("Chat receiver could not be determined.");
    return;
  }

  setSending(true);

  const { error } = await supabase
    .from("project_messages")
    .insert({
      project_id: Number(projectId),
      sender_id: userId,
      receiver_id: selectedDeveloper,
      message: body,
    });

  setSending(false);

  if (error) {
    console.error("CHAT SEND ERROR:", error);
    toast.error(error.message);
    return;
  }

  setText("");
};


  return (
    <div className="flex h-[420px] flex-col rounded-xl border border-border bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-semibold">
          Project Chat
        </h3>

        <p className="text-xs text-muted-foreground">
          Developer ↔ Innovator
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
      >
        {loading ? (
          <div className="grid h-full place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center">
            <p className="text-center text-sm text-muted-foreground">
              No messages yet 👋
              <br />
              Start the conversation.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === userId;

            return (
              <div
                key={m.id}
                className={`flex ${
                  mine
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="break-words">
                    {m.message}
                  </div>

                  <div className="mt-1 text-[10px] opacity-60">
                    {new Date(
                      m.created_at
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          placeholder="Type a message..."
          disabled={sending}
        />

        <Button
          type="submit"
          size="icon"
          disabled={
            sending || !text.trim()
          }
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

