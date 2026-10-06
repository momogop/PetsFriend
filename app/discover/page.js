"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { user, loading: userLoading } = useUser(true);
  const [myProfile, setMyProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [greetedIds, setGreetedIds] = useState(new Set());
  const [filter, setFilter] = useState("hepsi");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [index, setIndex] = useState(0);
  const [matchInfo, setMatchInfo] = useState(null);

  const [drag, setDrag] = useState({ x: 0, active: false });
  const startX = useRef(0);
  const cardRef = useRef(null);

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

  useEffect(() => {
    setIndex(0);
  }, [filter]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function sayHi(toProfile) {
    if (greetedIds.has(toProfile.id)) return;
    const { error } = await supabase.from("greetings").insert({ from_id: user.id, to_id: toProfile.id });
    if (error) return;

    setGreetedIds((prev) => new Set(prev).add(toProfile.id));
    showToast(toProfile.dog_name + "'in sahibine merhaba gönderildi 🐾");

    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .or(
        `and(user_a.eq.${user.id},user_b.eq.${toProfile.id}),and(user_a.eq.${toProfile.id},user_b.eq.${user.id})`
      )
      .maybeSingle();

    if (match) {
      setMatchInfo({
        matchId: match.id,
        dogName: toProfile.dog_name,
        photoUrl: toProfile.photo_url,
      });
    }
  }

  function nextCard() {
    setIndex((i) => i + 1);
    setDrag({ x: 0, active: false });
  }

  function handleLike(current) {
    if (!current) return;
    sayHi(current);
    nextCard();
  }

  function handleSkip() {
    nextCard();
  }

  function onPointerDown(e) {
    startX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setDrag({ x: 0, active: true });
  }
  function onPointerMove(e) {
    if (!drag.active) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const delta = clientX - startX.current;
    setDrag({ x: delta, active: true });
  }
  function onPointerUp() {
    if (!drag.active) return;
    const threshold = 110;
    if (drag.x > threshold) {
      const current = enriched[index];
      setDrag({ x: 400, active: false });
      setTimeout(() => handleLike(current), 150);
    } else if (drag.x < -threshold) {
      setDrag({ x: -400, active: false });
      setTimeout(() => handleSkip(), 150);
    } else {
      setDrag({ x: 0, active: false });
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
        <Link href="/profile" className="inline-block px-5 py-3 rounded-full bg-primary text-white text-sm font-semibold">
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
        <Link href="/profile" className="inline-block px-5 py-3 rounded-full bg-primary text-white text-sm font-semibold">
          Konumu paylaş
        </Link>
        <BottomNav />
      </div>
    );
  }

  const current = enriched[index];
  const upNext = enriched[index + 1];
  const rotation = drag.x / 18;
  const likeOpacity = Math.min(Math.max(drag.x / 100, 0), 1);
  const nopeOpacity = Math.min(Math.max(-drag.x / 100, 0), 1);

  return (
    <div className="px-5 pt-14 safe-top">
      <h1 className="font-display text-2xl font-semibold mb-1">Yakınındakiler</h1>
      <p className="text-muted text-sm mb-4 leading-relaxed">
        Sağa kaydır: merhaba de. Sola kaydır: sonraki köpeğe geç.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-none px-3.5 py-2 rounded-full border text-[13px] font-medium ${
              filter === f.key ? "bg-primary border-primary text-white" : "bg-surface border-line text-inksoft"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!current ? (
        <div className="text-center py-20 text-muted">
          <div className="text-3xl mb-2">🐕</div>
          <p className="text-sm">Şimdilik bu kadar. Zaman içinde daha çok kullanıcı katıldıkça burası dolacak.</p>
          {index > 0 && (
            <button
              onClick={() => setIndex(0)}
              className="mt-4 text-sm font-semibold text-primary underline underline-offset-2"
            >
              Baştan göster
            </button>
          )}
        </div>
      ) : (
        <div className="relative w-full" style={{ height: "62vh", maxHeight: "560px" }}>
          {upNext && (
            <div className="absolute inset-0 bg-surface rounded-card shadow-sm scale-95 translate-y-2 opacity-70" />
          )}

          <div
            ref={cardRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{
              transform: `translateX(${drag.x}px) rotate(${rotation}deg)`,
              transition: drag.active ? "none" : "transform 0.3s ease",
              touchAction: "pan-y",
            }}
            className="absolute inset-0 bg-surface rounded-card shadow-sm overflow-hidden flex flex-col cursor-grab active:cursor-grabbing select-none"
          >
            <div className="relative flex-1 bg-surface2 flex items-center justify-center overflow-hidden">
              {current.photo_url ? (
                <img src={current.photo_url} alt={current.dog_name} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center text-white text-4xl font-bold"
                  style={{ background: avatarColor(current.id) }}
                >
                  {current.dog_name?.charAt(0)?.toUpperCase()}
                </div>
              )}

              <div
                className="absolute top-6 left-6 border-4 border-primary text-primary font-display font-bold text-2xl px-3 py-1 rounded-lg -rotate-12"
                style={{ opacity: likeOpacity }}
              >
                MERHABA
              </div>
              <div
                className="absolute top-6 right-6 border-4 border-accent2 text-accent2 font-display font-bold text-2xl px-3 py-1 rounded-lg rotate-12"
                style={{ opacity: nopeOpacity }}
              >
                GEÇ
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display font-semibold text-xl">
                  {current.dog_name}
                  {current.pet_gender && (
                    <span className="ml-1.5 text-base align-middle">
                      {current.pet_gender === "dişi" ? "♀" : "♂"}
                    </span>
                  )}
                </span>
                <span className="text-[12px] text-muted flex-none">{formatDistance(current.km)}</span>
              </div>
              <div className="text-sm text-inksoft mb-2">
                {current.breed}
                {current.owner_gender && current.owner_gender !== "belirtmek istemiyorum" && (
                  <span className="text-muted"> · Sahibi: {current.owner_gender}</span>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap mb-1">
                <span className={`text-[11px] px-2.5 py-1 rounded-full capitalize ${energyTagClass(current.energy)}`}>
                  {current.energy}
                </span>
                {current.pet_gender && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface2 text-inksoft capitalize">
                    {current.pet_gender}
                  </span>
                )}
                {current.note && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface2 text-inksoft">{current.note}</span>
                )}
                {current.score != null && (
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold">
                    %{current.score} uyum
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {current && (
        <div className="flex items-center justify-center gap-6 mt-6">
          <button
            onClick={handleSkip}
            className="w-16 h-16 rounded-full bg-surface border border-line shadow-sm flex items-center justify-center text-2xl text-accent2"
            aria-label="Geç"
          >
            ✕
          </button>
          <button
            onClick={() => handleLike(current)}
            disabled={greetedIds.has(current.id)}
            className="w-16 h-16 rounded-full bg-primary shadow-sm flex items-center justify-center text-2xl text-white disabled:opacity-50"
            aria-label="Merhaba de"
          >
            🐾
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 bg-ink text-bg text-xs font-medium px-4 py-2.5 rounded-full z-50">
          {toast}
        </div>
      )}

      {matchInfo && (
        <div className="fixed inset-0 bg-ink/70 flex items-center justify-center z-50 px-6">
          <div className="bg-surface rounded-card p-6 text-center max-w-sm w-full">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="font-display text-2xl font-bold text-primary mb-1">Eşleştiniz!</h2>
            <p className="text-sm text-inksoft mb-5">
              Sen ve <strong>{matchInfo.dogName}</strong> birbirinizi beğendiniz. Şimdi sohbete başlayabilirsiniz.
            </p>
            <button
              onClick={() => router.push(`/chats/${matchInfo.matchId}`)}
              className="w-full py-3 rounded-full bg-primary text-white text-sm font-semibold mb-2"
            >
              Sohbete git
            </button>
            <button
              onClick={() => setMatchInfo(null)}
              className="w-full py-2 text-xs text-muted underline underline-offset-2"
            >
              Daha sonra
            </button>
          </div>
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
