"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg("");

    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="px-6 pt-16 pb-10 min-h-screen flex flex-col justify-center safe-top">
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">🐾</div>
        <h1 className="font-display text-2xl font-semibold">Pets Friend</h1>
        <p className="text-muted text-sm mt-1">Köpeğin için en yakın yürüyüş arkadaşını bul</p>
      </div>

      {status === "sent" ? (
        <div className="bg-surface rounded-card p-5 text-center shadow-sm">
          <p className="text-sm text-inksoft leading-relaxed">
            <strong>{email}</strong> adresine bir giriş linki gönderdik. Gelen kutunu kontrol et
            ve linke tıklayarak giriş yap.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-inksoft mb-1.5">
              E-posta adresin
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@eposta.com"
              className="w-full px-3.5 py-3 rounded-xl border border-line bg-surface text-ink text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {status === "error" && (
            <p className="text-xs text-accent2">{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3.5 rounded-full bg-primary text-white text-sm font-semibold disabled:opacity-50"
          >
            {status === "sending" ? "Gönderiliyor..." : "Giriş linki gönder"}
          </button>
          <p className="text-[11px] text-muted text-center leading-relaxed">
            Şifre yok — e-postana gönderilen linke tıklayarak giriş yaparsın.
          </p>
        </form>
      )}
    </div>
  );
}
