"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import BottomNav from "../../components/BottomNav";
import { distanceKm, formatDistance, energyMatchScore } from "../../lib/geo";

const FILTERS = [
  { key: "hepsi", label: "Hepsi" },
  { key: "enerjik", label: "Enerjik" },
  { key: "orta", label: "Orta" },
  { key: "sakin", label: "Sakin" },
];

export default function DiscoverPage() {
  const { user, loading: userLoading } = useUser(true);
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [greetedIds, setGreetedIds] = useState(new Set());
  const [filter, setFilter] = useState("hepsi");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      const [{ data: mine }, { data: all }, { data: greetings }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("*").neq("id", user.id),
        supabase.from("greetings").select("to_id").eq("from_id", user.id),
      ]);
      if (!active) return;
      setMyProfile(mine || null);
      setProfiles(all || []);
      setGreetedIds(new Set((greetings || []).map((g) => g.to_id)));
      setLoading(false);
    }
    load();

    // live updates: refresh when any profile changes
    const channel = supabase
      .channel("profiles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const enriched = useMemo(() => {
    return profiles
      .map((p) => {
        const km = myProfile ? distanceKm(myProfile.lat, myProfile.lng, p.lat, p.lng) : null;
        const score = myProfile ? energyMatchScore(myProfile.energy, p.energy) : null;
        return { ...p, km, score };
      })
      .filter((p) => filter === "hepsi" || p.energy === filter)
      .sort((a, b) => {
        if (a.km == null) return 1;
        if (b.km == null) return -1;
        return a.km - b.km;
      });
  }, [profiles, myProfile, filter]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function sayHi(toId, dogName) {
    if (greetedIds.has(toId)) return;
    const { error } = await supabase
      .from("greetings")
      .insert({ from_id: user.id, to_id: toId });
    if (!error) {
      setGreetedIds((prev) => new Set(prev).add(toId));
      showToast(dogName + "'in sahibine merhaba gönderildi 🐾");
    }
  }

  if (userLoading || loading) {
    return <div className="p-6 text-sm text-muted">Yükleniyor...</div>;
  }

  if (!myProfile) {
    return (
      <div className="px-5 pt-16 text-center safe-top">
        <div className="text-3xl mb-3">🐕</div>
        <p className="text-sm text-inksoft mb-4 leading-relaxed">
          Yakınındaki köpekleri görebilmek için önce profilini oluşturman gerekiyor.
        </p>
        <Link
          href="/profile"
          className="inline-block px-5 py-3 rounded-full bg-primary text-white text-sm font-semibold"
        >
          Profil oluştur
        </Link>
        <BottomNav />
      </div>
    );
  }

  if (myProfile.lat == null) {
    return (
      <div className="px-5 pt-16 text-center safe-top">
        <div className="text-3xl mb-3">📍</div>
        <p className="text-sm text-inksoft mb-4 leading-relaxed">
          Yakınındaki köpekleri görebilmek için konumunu paylaşman gerekiyor.
        </p>
        <Link
          href="/profile"
          className="inline-block px-5 py-3 rounded-full bg-primary text-white text-sm font-semibold"
        >
          Konumu paylaş
        </Link>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 safe-top">
      <h1 className="font-display text-2xl font-semibold mb-1">Yakınındakiler</h1>
      <p className="text-muted text-sm mb-4 leading-relaxed">
        Gerçek konumuna göre sıralandı. Enerji seviyesi uyumuna göre eşleşme yüzdesi hesaplanır.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-none px-3.5 py-2 rounded-full border text-[13px] font-medium ${
              filter === f.key
                ? "bg-primary border-primary text-white"
                : "bg-surface border-line text-inksoft"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-14 text-muted">
          <div className="text-3xl mb-2">🐕</div>
          <p className="text-sm">Bu filtreye uyan kimse yok. Zaman içinde daha çok kullanıcı katıldıkça burası dolacak.</p>
        </div>
      ) : (
        <div className="space-y-3.5 pb-6">
          {enriched.map((p) => {
            const isGreeted = greetedIds.has(p.id);
            return (
              <div key={p.id} className="bg-surface rounded-card p-4 shadow-sm flex gap-3.5">
                <div
                  className="w-[58px] h-[58px] rounded-2xl flex-none flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: avatarColor(p.id) }}
                >
                  {p.dog_name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display font-semibold text-[17px]">{p.dog_name}</span>
                    <span className="text-[12px] text-muted flex-none">{formatDistance(p.km)}</span>
                  </div>
                  <div className="text-[13px] text-inksoft mb-2">{p.breed}</div>
                  <div className="flex gap-1.5 flex-wrap mb-2.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full capitalize ${energyTagClass(p.energy)}`}>
                      {p.energy}
                    </span>
                    {p.note && (
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface2 text-inksoft">
                        {p.note}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-primary">
                      {p.score != null ? `%${p.score} uyum` : ""}
                    </span>
                    <button
                      onClick={() => sayHi(p.id, p.dog_name)}
                      disabled={isGreeted}
                      className={`text-[13px] font-semibold px-4 py-2 rounded-full ${
                        isGreeted ? "border border-line text-inksoft" : "bg-primary text-white"
                      }`}
                    >
                      {isGreeted ? "Gönderildi ✓" : "Merhaba de"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 bg-ink text-bg text-xs font-medium px-4 py-2.5 rounded-full z-50">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

const AVATAR_COLORS = ["#3C6E47", "#C1592C", "#E2A33B", "#6B7566", "#2A4E33", "#8B5E3C"];
function avatarColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function energyTagClass(energy) {
  if (energy === "enerjik") return "bg-accent/20 text-accent2";
  if (energy === "sakin") return "bg-muted/15 text-muted";
  return "bg-primary/15 text-primary";
}
