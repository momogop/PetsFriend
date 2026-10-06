"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useUser } from "../../../lib/useUser";
import BottomNav from "../../../components/BottomNav";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId;
  const { user, loading: userLoading } = useUser(true);

  const [profile, setProfile] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    if (!user || !userId) return;
    let active = true;

    (async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      const { data: photos } = await supabase
        .from("profile_photos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (active) {
        setProfile(profileData);
        setGallery(photos || []);
        setActivePhoto(profileData?.photo_url || photos?.[0]?.url || null);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, userId]);

  if (userLoading || loading) {
    return <div className="p-6 text-sm text-muted">Yükleniyor...</div>;
  }

  if (!profile) {
    return (
      <div className="px-5 pt-16 text-center safe-top">
        <p className="text-sm text-inksoft mb-4">Bu profil bulunamadı.</p>
        <button onClick={() => router.back()} className="text-sm font-semibold text-primary underline">
          Geri dön
        </button>
        <BottomNav />
      </div>
    );
  }

  const allPhotos = [profile.photo_url, ...gallery.map((g) => g.url)].filter(Boolean);

  return (
    <div className="pb-8 safe-top">
      <div className="flex items-center gap-3 px-5 pt-5 mb-3">
        <button onClick={() => router.back()} className="text-xl text-inksoft">
          ←
        </button>
        <span className="font-display font-semibold text-lg">
          {profile.dog_name}
          {profile.pet_gender && (
            <span className="ml-1.5 text-base align-middle">
              {profile.pet_gender === "dişi" ? "♀" : "♂"}
            </span>
          )}
        </span>
      </div>

      <div className="px-5">
        <div className="w-full aspect-square rounded-card overflow-hidden bg-surface2 flex items-center justify-center mb-3">
          {activePhoto ? (
            <img src={activePhoto} alt={profile.dog_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-5xl">🐶</span>
          )}
        </div>

        {allPhotos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
            {allPhotos.map((url, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(url)}
                className={`flex-none w-16 h-16 rounded-xl overflow-hidden border-2 ${
                  activePhoto === url ? "border-primary" : "border-transparent"
                }`}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="bg-surface rounded-card p-4 shadow-sm mb-4">
          <div className="text-sm text-inksoft mb-2">
            {profile.breed}
            {profile.owner_gender && profile.owner_gender !== "belirtmek istemiyorum" && (
              <span className="text-muted"> · Sahibi: {profile.owner_gender}</span>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {profile.energy && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary/15 text-primary capitalize">
                {profile.energy}
              </span>
            )}
            {profile.size && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface2 text-inksoft capitalize">
                {profile.size} boy
              </span>
            )}
            {profile.pet_gender && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-surface2 text-inksoft capitalize">
                {profile.pet_gender}
              </span>
            )}
          </div>
          {profile.note && (
            <p className="text-sm text-inksoft mt-3 leading-relaxed">{profile.note}</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
