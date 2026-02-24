"use client";

import { useState } from "react";
import { apiPost, setToken } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import GVQShell from "@/components/GVQShell";
import LoadingDots from "@/components/LoadingDots";

function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "white",
        outline: "none",
        ...props.style,
      }}
    />
  );
}

function Button({ children, onClick, disabled, variant = "solid", title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: variant === "solid" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontWeight: 900,
      }}
    >
      {children}
    </button>
  );
}

export default function OtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(() => searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // cooldown UI (não substitui o backend, só evita spam no botão)
  const [cooldown, setCooldown] = useState(0);

  async function resend() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMsg("Digite seu e-mail.");

    if (cooldown > 0) return;

    setLoading(true);
    setMsg("");

    const r = await apiPost("/api/auth/request-otp", { email: cleanEmail }, { auth: false });

    setLoading(false);

    if (!r.ok) return setMsg(r.error || "Erro ao reenviar.");

    setMsg("✅ Código reenviado. Verifique seu e-mail.");

    // inicia cooldown de 30s no UI (backend ainda manda o cooldown real)
    setCooldown(30);
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function verifyOtp(e) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail) return setMsg("Digite seu e-mail.");
    if (cleanCode.length !== 6) return setMsg("Digite o código de 6 dígitos.");

    setMsg("");
    setLoading(true);

    const r = await apiPost(
      "/api/auth/verify-otp",
      { email: cleanEmail, code: cleanCode },
      { auth: false }
    );

    setLoading(false);

    if (!r.ok) return setMsg(r.error || "Erro ao verificar OTP");

    const token = r.token;
    if (!token) return setMsg("Token não retornou. Tente novamente.");

    setToken(token);
    router.replace("/dashboard");
  }

  return (
    <GVQShell title="GVQ — Verificar Código" subtitle="Selando seu acesso ao Reino de Sonoralis">
      <main style={{ maxWidth: 520 }}>
        <form onSubmit={verifyOtp} style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 6 }}>E-mail</div>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 6 }}>Código (6 dígitos)</div>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              disabled={loading}
              style={{ width: 220, letterSpacing: 4 }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
            <Button disabled={loading || code.trim().length !== 6}>
              {loading ? <LoadingDots label="Validando" /> : "Entrar"}
            </Button>

            <Button
              variant="ghost"
              onClick={resend}
              disabled={loading || cooldown > 0}
              title="Reenviar o código (respeita cooldown do backend)"
            >
              {cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar código"}
            </Button>

            <Button variant="ghost" onClick={() => router.replace("/login")} disabled={loading}>
              Voltar
            </Button>
          </div>
        </form>

        {msg ? (
          <div
            style={{
              marginTop: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 10,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            {msg}
          </div>
        ) : null}
      </main>
    </GVQShell>
  );
}