"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import BottomNav from "../../components/BottomNav";

export default function ChatsPage() {
  const { user, loading: userLoading } = useUser(true);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      const { data: matchRows } = await supabase
        .from("matches")
        .select("*")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!active || !matchRows) {
        setLoading(false);
        return;
      }

      const otherIds = matchRows.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, dog_name, photo_url")
        .in("id", otherIds.length > 0 ? otherIds : ["00000000-0000-0000-0000-000000000000"]);

      const { data: lastMessages } = await supabase
        .from("messages")
        .select("match_id, content, created_at")
        .in("match_id", matchRows.map((m) => m.id))
        .order("created_at", { ascending: false });

      const profileMap = {};
      (profilesData || []).forEach((p) => (profileMap[p.id] = p));

      const lastMsgMap = {};
      (lastMessages || []).forEach((msg) => {
        if (!lastMsgMap[msg.match_id]) lastMsgMap[msg.match_id] = msg;
      });

      const enriched = matchRows.map((m) => {
        const otherId = m.user_a === user.id ? m.user_b : m.user_a;
        return {
          matchId: m.id,
          otherProfile: profileMap[otherId] || { dog_name: "Bir kullanıcı" },
          lastMessage: lastMsgMap[m.id]?.content || null,
        };
      });

      if (active) {
        setMatches(enriched);
        setLoading(false);
      }
    }

    load();

    const channel = supabase
      .channel("matches-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (userLoading || loading) {
    return <div className="p-6 text-sm text-muted">Yükleniyor...</div>;
  }

  return (
    <div className="px-5 pt-14 safe-top">
      <h1 className="font-display text-2xl font-semibold mb-1">Sohbetler</h1>
      <p className="text-muted text-sm mb-5 leading-relaxed">
        Eşleştiğin kullanıcılarla burada sohbet edebilirsin.
      </p>

      {matches.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <div className="text-3xl mb-2">💬</div>
          <p className="text-sm">Henüz bir eşleşmen yok. Keşfet sekmesinden köpekleri kaydırmaya başla.</p>
        </div>
      ) : (
        <div className="space-y-2 pb-6">
          {matches.map((m) => (
            <Link
              key={m.matchId}
              href={`/chats/${m.matchId}`}
              className="flex items-center gap-3 bg-surface rounded-card p-3.5 shadow-sm"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface2 flex-none flex items-center justify-center">
                {m.otherProfile.photo_url ? (
                  <img src={m.otherProfile.photo_url} alt={m.otherProfile.dog_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🐶</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-[15px]">{m.otherProfile.dog_name}</div>
                <div className="text-xs text-muted truncate">
                  {m.lastMessage || "Sohbete başla..."}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
