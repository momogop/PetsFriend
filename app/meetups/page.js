"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import BottomNav from "../../components/BottomNav";

export default function MeetupsPage() {
  const { user, loading: userLoading } = useUser(true);
  const [myProfile, setMyProfile] = useState(null);
  const [meetups, setMeetups] = useState([]);
  const [attendeeCounts, setAttendeeCounts] = useState({});
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;

    async function load() {
      const [{ data: mine }, { data: allMeetups }, { data: attendees }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("meetups").select("*").order("created_at", { ascending: false }),
        supabase.from("meetup_attendees").select("meetup_id, user_id"),
      ]);
      if (!active) return;
      setMyProfile(mine || null);
      setMeetups(allMeetups || []);

      const counts = {};
      const joined = new Set();
      (attendees || []).forEach((a) => {
        counts[a.meetup_id] = (counts[a.meetup_id] || 0) + 1;
        if (a.user_id === user.id) joined.add(a.meetup_id);
      });
      setAttendeeCounts(counts);
      setJoinedIds(joined);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("meetups-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "meetups" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "meetup_attendees" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  async function createMeetup(e) {
    e.preventDefault();
    if (!location.trim() || !time.trim()) {
      showToast("Yer ve zaman bilgisi gerekli");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("meetups")
      .insert({
        host_id: user.id,
        host_name: myProfile?.dog_name || "Bir kullanıcı",
        location: location.trim(),
        meetup_time: time.trim(),
        note: note.trim(),
        lat: myProfile?.lat ?? null,
        lng: myProfile?.lng ?? null,
      })
      .select()
      .single();

    if (!error && data) {
      await supabase.from("meetup_attendees").insert({
        meetup_id: data.id,
        user_id: user.id,
        user_name: myProfile?.dog_name || "Sen",
      });
    }

    setSaving(false);
    if (error) {
      showToast("Oluşturulamadı: " + error.message);
    } else {
      setLocation("");
      setTime("");
      setNote("");
      setModalOpen(false);
      showToast("Buluşma oluşturuldu 🎉");
    }
  }

  async function joinMeetup(meetupId) {
    if (joinedIds.has(meetupId)) return;
    const { error } = await supabase.from("meetup_attendees").insert({
      meetup_id: meetupId,
      user_id: user.id,
      user_name: myProfile?.dog_name || "Sen",
    });
    if (!error) {
      showToast("Buluşmaya katıldın, iyi yürüyüşler!");
    }
  }

  if (userLoading || loading) {
    return <div className="p-6 text-sm text-muted">Yükleniyor...</div>;
  }

  return (
    <div className="px-5 pt-14 safe-top">
      <h1 className="font-display text-2xl font-semibold mb-1">Buluşmalar</h1>
      <p className="text-muted text-sm mb-5 leading-relaxed">
        Parkta ya da sahilde planlanan gerçek buluşmalara katıl, ya da kendi buluşmanı oluştur.
      </p>

      {meetups.length === 0 ? (
        <div className="text-center py-14 text-muted">
          <div className="text-3xl mb-2">📍</div>
          <p className="text-sm">Henüz bir buluşma yok. İlk buluşmayı sen oluştur.</p>
        </div>
      ) : (
        <div className="space-y-3.5 pb-6">
          {meetups.map((m) => {
            const isJoined = joinedIds.has(m.id);
            const count = attendeeCounts[m.id] || 0;
            return (
              <div
                key={m.id}
                className="bg-surface rounded-card p-4 shadow-sm border-l-[3px]"
                style={{ borderLeftColor: "#E2A33B" }}
              >
                <div className="font-display font-semibold text-[16px]">{m.location}</div>
                <div className="text-[12px] font-semibold text-accent2 mt-0.5">{m.meetup_time}</div>
                {m.note && <div className="text-[13px] text-inksoft mt-2 leading-relaxed">{m.note}</div>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[12px] text-muted">
                    {count} katılımcı · {m.host_name} başlattı
                  </span>
                  <button
                    onClick={() => joinMeetup(m.id)}
                    disabled={isJoined}
                    className={`text-[13px] font-semibold px-4 py-2 rounded-full ${
                      isJoined ? "border border-line text-inksoft" : "bg-primary text-white"
                    }`}
                  >
                    {isJoined ? "Katıldın ✓" : "Katıl"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setModalOpen(true)}
        className="fixed right-5 bottom-24 w-[52px] h-[52px] rounded-full bg-accent2 text-white text-2xl shadow-lg flex items-center justify-center z-30"
      >
        +
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 bg-ink/40 flex items-end justify-center z-40"
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <div className="w-full max-w-[460px] bg-bg rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto">
            <h2 className="font-display text-lg font-semibold mb-4">Yeni buluşma oluştur</h2>
            <form onSubmit={createMeetup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1.5">Nerede?</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Örn. Yıldız Parkı"
                  className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1.5">Ne zaman?</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="Örn. Bugün 18:30"
                  className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-inksoft mb-1.5">
                  Not (opsiyonel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Örn. Enerjik köpekler için ideal, top getirin"
                  className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface text-sm min-h-[70px]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Oluşturuluyor..." : "Buluşmayı oluştur"}
              </button>
            </form>
          </div>
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
