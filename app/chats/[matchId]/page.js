"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useUser } from "../../../lib/useUser";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId;
  const { user, loading: userLoading } = useUser(true);

  const [match, setMatch] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user || !matchId) return;
    let active = true;

    async function load() {
      const { data: matchData } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
      if (!matchData || (matchData.user_a !== user.id && matchData.user_b !== user.id)) {
        router.replace("/chats");
        return;
      }
      if (!active) return;
      setMatch(matchData);

      const otherId = matchData.user_a === user.id ? matchData.user_b : matchData.user_a;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("dog_name, photo_url")
        .eq("id", otherId)
        .maybeSingle();
      if (active) setOtherProfile(profileData);

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (active) {
        setMessages(msgs || []);
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, matchId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    });
    setSending(false);
    if (error) {
      setText(content);
    }
  }

  if (userLoading || loading) {
    return <div className="p-6 text-sm text-muted">Yükleniyor...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen safe-top">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-surface">
        <button onClick={() => router.push("/chats")} className="text-xl text-inksoft">
          ←
        </button>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-surface2 flex-none flex items-center justify-center">
          {otherProfile?.photo_url ? (
            <img src={otherProfile.photo_url} alt={otherProfile.dog_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-base">🐶</span>
          )}
        </div>
        <span className="font-display font-semibold text-[15px]">
          {otherProfile?.dog_name || "Sohbet"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 pb-24">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted mt-8">
            Henüz mesaj yok. İlk mesajı sen gönder 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    mine ? "bg-primary text-white rounded-br-sm" : "bg-surface text-ink rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[460px] bg-surface border-t border-line px-3 py-3 flex gap-2 safe-bottom"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yaz..."
          className="flex-1 px-3.5 py-2.5 rounded-full border border-line bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="px-4 py-2.5 rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-50"
        >
          Gönder
        </button>
      </form>
    </div>
  );
}
