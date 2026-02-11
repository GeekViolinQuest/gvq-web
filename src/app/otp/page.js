export const dynamic = "force-dynamic";

"use client";

import { useState } from "react";
import { apiFetch, setToken } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function verifyOtp(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const r = await apiFetch("/api/auth/verify-otp", {
      method: "POST",
      body: { email, code },
    });

    setLoading(false);

    if (!r.ok) return setMsg(r.data?.error || "Erro ao verificar OTP");

    setToken(r.data.token);
    router.push("/dashboard");
  }

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1>GVQ — Verificar código</h1>

      <form onSubmit={verifyOtp}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          style={{ width: "100%", padding: 12, marginTop: 12 }}
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código (6 dígitos)"
          style={{ width: "100%", padding: 12, marginTop: 12 }}
        />
        <button disabled={loading} style={{ marginTop: 12, padding: 12 }}>
          {loading ? "Validando..." : "Entrar"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
