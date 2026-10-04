"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // supabase-js parses the magic-link tokens from the URL automatically
    // (detectSessionInUrl: true). We just wait for the session, then route.
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        router.replace("/discover");
      } else {
        router.replace("/login");
      }
    });
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted text-sm">Giriş yapılıyor...</p>
    </div>
  );
}
