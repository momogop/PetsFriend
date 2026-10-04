"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useUser } from "../../lib/useUser";
import BottomNav from "../../components/BottomNav";

const SIZES = ["küçük", "orta", "büyük"];
const ENERGIES = ["sakin", "orta", "enerjik"];

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const [dogName, setDogName] = useState("");
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState("orta");
  const [energy, setEnergy] = useState("orta");
  const [note, setNote] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locStatus, setLocStatus] = useState("idle"); // idle | requesting | granted | denied

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setDogName(data.dog_name || "");
        setBreed(data.breed || "");
        setSize(data.size || "orta");
        setEnergy(data.energy || "orta");
        setNote(data.note || "");
        setLat(data.lat ?? null);
        setLng(data.lng ?? null);
        if (data.lat != null) setLocStatus("granted");
      }
      setLoading(false);
    })();
  }, [user]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      showToast("Tarayıcın konum özelliğini desteklemiyor");
      return;
    }
    setLocStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocStatus("granted");
        showToast("Konum alındı");
      },
      () => {
        setLocStatus("denied");
        showToast("Konum izni verilmedi");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!dogName.trim() || !breed.trim()) {
      showToast("Lütfen köpeğinin adını ve cinsini gir");
      return;
    }
    setSaving(true);
    const payload = {
      id: user.id,
      dog_name: dogName.trim(),
      breed: breed.trim(),
      size,
      energy,
      note: note.trim(),
      lat,
      lng,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSaving(false);
    if (error) {
      showToast("Kaydedilemedi: " + error.message);
    } else {
      showToast("Profil kaydedildi 🐾");
    }
  }

  if (userLoading || loading) {
    return <div className="p-6 text-sm text-muted">Yükleniyor...</div>;
  }

  return (
    <div className="px-5 pt-14 safe-top">
      <h1 className="font-display text-2xl font-semibold mb-1">Profilim</h1>
      <p className="text-muted text-sm mb-5 leading-relaxed">
        Köpeğinin bilgileri ve konumun, sana uygun yürüyüş arkadaşlarını göstermemizi sağlar.
      </p>

      <div className="bg-surface rounded-card p-4 mb-5 shadow-sm">
        <p className="text-xs font-semibold text-inksoft mb-2">Konum</p>
        {locStatus === "granted" ? (
          <p className="text-xs text-primary font-medium">Konumun paylaşılıyor ✓</p>
        ) : (
          <p className="text-xs text-muted mb-2 leading-relaxed">
            Yakınındaki köpekleri görmek için konumunu paylaşman gerekiyor. Sadece diğer
            kullanıcılara yaklaşık mesafe olarak gösterilir.
          </p>
        )}
        <button
          type="button"
          onClick={requestLocation}
          className="mt-2 text-xs font-semibold text-primary underline underline-offset-2"
        >
          {locStatus === "granted" ? "Konumu güncelle" : "Konumumu paylaş"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4 pb-6">
        <Field label="Köpeğinin adı">
          <input
            type="text"
            value={dogName}
            onChange={(e) => setDogName(e.target.value)}
            placeholder="Örn. Karabaş"
            className="input"
          />
        </Field>
        <Field label="Cinsi">
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="Örn. Golden Retriever"
            className="input"
          />
        </Field>
        <Field label="Boyu">
          <Segmented options={SIZES} value={size} onChange={setSize} />
        </Field>
        <Field label="Enerji seviyesi">
          <Segmented options={ENERGIES} value={energy} onChange={setEnergy} />
        </Field>
        <Field label="Kısa not (opsiyonel)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn. Diğer köpeklerle çekingen ama insanları sever"
            className="input min-h-[70px]"
          />
        </Field>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="w-full py-2 text-xs text-muted underline underline-offset-2"
        >
          Çıkış yap
        </button>
      </form>

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-24 bg-ink text-bg text-xs font-medium px-4 py-2.5 rounded-full z-50">
          {toast}
        </div>
      )}

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #d8decb;
          background: #fff;
          font-size: 14px;
          font-family: inherit;
        }
      `}</style>

      <BottomNav />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-inksoft mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          type="button"
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex-1 text-center py-2.5 px-2 rounded-xl border text-[13px] font-medium capitalize ${
            value === opt
              ? "border-primary bg-primary/10 text-primary font-bold"
              : "border-line bg-surface text-inksoft"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
