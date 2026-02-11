"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const r = await apiFetch("/api/auth/request-otp", {
      method: "POST",
      body: { email },
    });

    setLoading(false);

    if (!r.ok) return setMsg(r.data?.error || "Erro ao pedir OTP");

    // ✅ Redireciona automaticamente para /otp, passando o email
    router.push(`/otp?email=${encodeURIComponent(email)}`);
  }

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1>GVQ — Login</h1>

      <form onSubmit={requestOtp}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          style={{ width: "100%", padding: 12, marginTop: 12 }}
        />

        <button disabled={loading} style={{ marginTop: 12, padding: 12 }}>
          {loading ? "Enviando..." : "Enviar código"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
