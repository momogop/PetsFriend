"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthConfirm() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get("token_hash");
    const type = params.get("type") || "email";

    if (!tokenHash) {
      router.replace("/login");
      return;
    }

    supabase.auth.verifyOtp({ token_hash: tokenHash, type }).then(({ error }) => {
      if (error) {
        setError(true);
        setTimeout(() => router.replace("/login"), 2500);
      } else {
        router.replace("/discover");
      }
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted text-sm">
        {error ? "Link geçersiz veya süresi dolmuş. Giriş sayfasına yönlendiriliyorsun..." : "Giriş yapılıyor..."}
      </p>
    </div>
  );
}
