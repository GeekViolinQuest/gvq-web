"use client";

import React, { useMemo, useState } from "react";
import GVQShell from "@/components/GVQShell";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

function Card({ children }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 14,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, disabled, variant = "primary", title, type = "button", style }) {
  const bg =
    variant === "ghost"
      ? "rgba(255,255,255,0.06)"
      : variant === "danger"
      ? "rgba(255,80,80,0.18)"
      : "rgba(255,255,255,0.10)";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: bg,
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontWeight: 800,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      style={{
        width: "100%",
        padding: 12,
        fontSize: 16,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "white",
        outline: "none",
      }}
    />
  );
}

function RewardCard({ reward, type, gainedLevel, code }) {
  if (!reward) return null;

  const safeNome = reward?.nome || "Recompensa";
  const titlePrefix = type === "runa" ? "Runa" : "Relíquia";

  const title = safeNome?.toLowerCase().startsWith(titlePrefix.toLowerCase())
    ? safeNome
    : `${titlePrefix} ${safeNome}`;

  const imgSrc = reward?.imagem || "/locked.png";

  return (
    <div
      style={{
        marginTop: 14,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          flex: "0 0 auto",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={safeNome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>

        <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>
          Código: <span style={{ opacity: 1 }}>{code || "—"}</span>
          {type === "runa" && reward?.tipo ? (
            <span style={{ marginLeft: 10, opacity: 0.85 }}>• Runa {reward.tipo}</span>
          ) : null}
        </div>

        {gainedLevel ? (
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>⬆️ +{gainedLevel} nível</div>
        ) : null}
      </div>
    </div>
  );
}

function normalizeRedeemCode(raw) {
  // aceita: "!runa001", "runa001", "RUNA001", "  !RunaOrigem  "
  let s = String(raw || "").trim();
  if (!s) return "";
  s = s.replace(/\s+/g, ""); // remove espaços no meio
  if (!s.startsWith("!")) s = "!" + s;
  return s.toLowerCase();
}

export default function ResgatarPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [result, setResult] = useState(null); // {ok, type, code, reward, gainedLevel, aluno}

  // Ligue/desligue o redirect automático aqui
  const AUTO_REDIRECT = true;

  const cleanedPreview = useMemo(() => normalizeRedeemCode(code), [code]);
  const canSubmit = useMemo(() => !!cleanedPreview && !loading, [cleanedPreview, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setResult(null);

    const cleaned = normalizeRedeemCode(code);
    if (!cleaned) {
      setLoading(false);
      setError("Digite um código.");
      return;
    }

    try {
      const res = await apiFetch("/api/redeem", {
        method: "POST",
        auth: true,
        body: { code: cleaned },
      });

      if (!res?.ok) {
        throw new Error(res?.error || "Erro ao resgatar");
      }

      setResult(res);

      setMessage(res?.type === "runa" ? "✨ Runa resgatada com sucesso!" : "🏆 Relíquia conquistada!");

      setCode("");

      if (AUTO_REDIRECT) {
        setTimeout(() => {
          router.push("/perfil");
        }, 900);
      }
    } catch (err) {
      setError(err?.message || "Erro ao resgatar");
    } finally {
      setLoading(false);
    }
  }

  const right = (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <Link href="/dashboard" style={{ textDecoration: "none" }}>
        <Button variant="ghost">← Voltar ao Dashboard</Button>
      </Link>
      <Link href="/perfil" style={{ textDecoration: "none" }}>
        <Button variant="ghost">👤 Ir para Perfil</Button>
      </Link>
    </div>
  );
}