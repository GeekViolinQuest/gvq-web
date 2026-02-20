"use client";

import React, { useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";

function RewardCard({ reward, type, gainedLevel, code }) {
  if (!reward) return null;

  const safeNome = reward?.nome || "Recompensa";
  const titlePrefix = type === "runa" ? "Runa" : "Relíquia";
  const title = safeNome?.startsWith(titlePrefix) ? safeNome : `${titlePrefix} ${safeNome}`;

  return (
    <div
      style={{
        marginTop: 18,
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 14,
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      {reward.imagem ? (
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
          <img
            src={reward.imagem}
            alt={safeNome}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>

        <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
          Código: <span style={{ opacity: 1 }}>{code || "—"}</span>
          {type === "runa" && reward.tipo ? (
            <span style={{ marginLeft: 10, opacity: 0.85 }}>• Runa {reward.tipo}</span>
          ) : null}
        </div>

        {gainedLevel ? (
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.9 }}>
            ⬆️ +{gainedLevel} nível
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ResgatarPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [result, setResult] = useState(null); // {ok, type, code, reward, gainedLevel}

  // Opcional: liga/desliga o redirecionamento automático
  const AUTO_REDIRECT = true;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setResult(null);

    const cleaned = code.trim();
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

      setMessage(
        res?.type === "runa"
          ? "✨ Runa resgatada com sucesso! Atualizando seu Perfil..."
          : "🏆 Relíquia conquistada! Atualizando seu Perfil..."
      );

      setCode("");

      // ✅ Atualiza sem F5: vai pro /perfil (que roda o useEffect)
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

  return (
    <AuthGate>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <h1 style={{ fontSize: 30, marginBottom: 6 }}>Resgatar Código</h1>
        <div style={{ opacity: 0.8 }}>Digite o código da sua Runa ou Relíquia.</div>

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <input
            type="text"
            placeholder="Digite seu código..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
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

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 12,
              padding: 12,
              width: "100%",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              cursor: "pointer",
            }}
          >
            {loading ? "Resgatando..." : "Resgatar"}
          </button>
        </form>

        {message ? <p style={{ marginTop: 14, color: "#9ae6b4" }}>{message}</p> : null}
        {error ? <p style={{ marginTop: 14, color: "#feb2b2" }}>❌ {error}</p> : null}

        {/* ✅ Card com imagem/nome */}
        {result?.ok ? (
          <>
            <RewardCard
              reward={result.reward}
              type={result.type}
              gainedLevel={result.gainedLevel}
              code={result.code}
            />

            {/* ✅ Botão opcional (bom mesmo com auto-redirect desligado) */}
            <button
              type="button"
              onClick={() => router.push("/perfil")}
              style={{
                marginTop: 12,
                padding: 12,
                width: "100%",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                cursor: "pointer",
              }}
            >
              Ver no Perfil agora →
            </button>
          </>
        ) : null}
      </div>
    </AuthGate>
  );
}