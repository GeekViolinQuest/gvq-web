"use client";

import React, { useEffect, useMemo, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";

function RewardCard({ title, subtitle, img, extra, kind }) {
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
      {img ? (
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
            src={img}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
          {kind ? (
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                opacity: 0.9,
              }}
            >
              {kind}
            </span>
          ) : null}
        </div>

        {subtitle ? (
          <div style={{ opacity: 0.85, marginTop: 4, fontSize: 13 }}>
            {subtitle}
          </div>
        ) : null}

        {extra ? (
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700 }}>
            {extra}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function ResgatarPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const [catalog, setCatalog] = useState(null);
  const [catErr, setCatErr] = useState("");

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [reward, setReward] = useState(null); // { type, code, nome, imagem, tipoRuna? }

  useEffect(() => {
    let alive = true;

    async function loadCatalog() {
      try {
        setCatErr("");
        const catResp = await apiGet("/api/meta/catalog");
        if (!alive) return;

        if (!catResp?.ok) {
          throw new Error(catResp?.error || "Falha ao carregar catálogo");
        }
        setCatalog(catResp);
      } catch (e) {
        if (!alive) return;
        setCatErr(e.message || "Erro ao carregar catálogo");
      }
    }

    loadCatalog();
    return () => {
      alive = false;
    };
  }, []);

  const catalogRunas = useMemo(() => catalog?.runas || {}, [catalog]);
  const catalogReliquias = useMemo(() => catalog?.reliquias || {}, [catalog]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setReward(null);

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
        throw new Error(res?.error || "Falha ao resgatar");
      }

      const type = res.type; // "runa" | "reliquia"
      const normalizedCode = res.code; // já normalizado pelo backend

      // lookup no catálogo (se ainda não carregou, cai no fallback)
      if (type === "runa") {
        const data = catalogRunas?.[normalizedCode];
        setReward({
          type,
          code: normalizedCode,
          nome: data?.nome || `Runa (${normalizedCode})`,
          imagem: data?.imagem || null,
          tipo: data?.tipo || null,
        });
        setMessage("✨ Runa resgatada com sucesso!");
      } else {
        const data = catalogReliquias?.[normalizedCode];
        setReward({
          type,
          code: normalizedCode,
          nome: data?.nome || `Relíquia (${normalizedCode})`,
          imagem: data?.imagem || null,
        });
        setMessage("🏆 Relíquia conquistada!");
      }

      setCode("");
    } catch (err) {
      setError(err?.message || "Erro ao resgatar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate>
      <div style={{ padding: 40, maxWidth: 520 }}>
        <h1>Resgatar Código</h1>

        {catErr ? (
          <div style={{ marginTop: 10, opacity: 0.85 }}>
            ⚠️ Catálogo não carregou: {catErr}
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              (Ainda dá pra resgatar; só pode não mostrar nome/imagem.)
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Digite seu código..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              fontSize: 16,
              marginTop: 20,
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 20,
              padding: 10,
              width: "100%",
              cursor: "pointer",
            }}
          >
            {loading ? "Resgatando..." : "Resgatar"}
          </button>
        </form>

        {message ? <p style={{ marginTop: 16, color: "green" }}>{message}</p> : null}
        {error ? <p style={{ marginTop: 16, color: "red" }}>{error}</p> : null}

        {reward ? (
          <RewardCard
            title={reward.nome}
            subtitle={`Código: ${reward.code}`}
            img={reward.imagem}
            kind={
              reward.type === "runa"
                ? reward.tipo
                  ? `Runa ${reward.tipo}`
                  : "Runa"
                : "Relíquia"
            }
            extra={reward.type === "runa" ? "⬆️ +1 nível" : null}
          />
        ) : null}
      </div>
    </AuthGate>
  );
}
