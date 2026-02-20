"use client";

import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

export default function SeasonPage() {
  const [tab, setTab] = useState("weekly"); // weekly | epic
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const [epicInfo, setEpicInfo] = useState({ loading: true, active: false, event: null });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadEpic() {
      try {
        setEpicInfo({ loading: true, active: false, event: null });
        const r = await apiGet("/api/season/epic-active");
        if (!alive) return;

        if (!r?.ok) throw new Error(r?.error || "Falha ao checar Quest Épica");
        setEpicInfo({ loading: false, active: !!r.active, event: r.event || null });

        // se não tem épica, garante semanal selecionada
        if (!r.active) setTab("weekly");
      } catch (e) {
        if (!alive) return;
        setEpicInfo({ loading: false, active: false, event: null });
      }
    }

    loadEpic();
    return () => (alive = false);
  }, []);

  const epicDisabled = useMemo(() => {
    if (epicInfo.loading) return true;
    return !epicInfo.active;
  }, [epicInfo]);

  async function submit() {
    setLoading(true);
    setMessage("");
    setError("");

    const cleaned = url.trim();
    if (!cleaned) {
      setLoading(false);
      setError("Cole o link do seu vídeo.");
      return;
    }

    try {
      const endpoint =
        tab === "weekly" ? "/api/season/weekly-submit" : "/api/season/epic-submit";

      const r = await apiFetch(endpoint, {
        method: "POST",
        auth: true,
        body: { url: cleaned },
      });

      if (!r?.ok) throw new Error(r?.error || "Falha ao enviar");

      if (r.type === "weekly") {
        setMessage(`✅ Quest Semanal registrada! (+${r.gained ?? 2} Cristais)`);
      } else {
        const title = r?.event?.title ? ` — ${r.event.title}` : "";
        setMessage(`🔥 Quest Épica registrada${title}! (+${r.gained ?? 5} Cristais)`);
      }

      setUrl("");
    } catch (e) {
      setError(e?.message || "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <h1 style={{ fontSize: 34, marginBottom: 6 }}>Season Quests</h1>
        <div style={{ opacity: 0.8, marginBottom: 18 }}>
          Envie o link do seu vídeo (YouTube / Shorts / etc).
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button
            onClick={() => setTab("weekly")}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: tab === "weekly" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: "white",
              cursor: "pointer",
            }}
          >
            🧭 Quest Semanal
          </button>

          <button
            onClick={() => !epicDisabled && setTab("epic")}
            disabled={epicDisabled}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: tab === "epic" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: "white",
              opacity: epicDisabled ? 0.35 : 1,
              cursor: epicDisabled ? "not-allowed" : "pointer",
            }}
            title={
              epicDisabled
                ? "Não há Quest Épica ativa no momento."
                : "Quest Épica disponível"
            }
          >
            ⚔️ Quest Épica
          </button>
        </div>

        {tab === "epic" && epicInfo.active && epicInfo.event ? (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontWeight: 800 }}>🔥 {epicInfo.event.title}</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
              Evento ativo até:{" "}
              {epicInfo.event.endsAt ? new Date(epicInfo.event.endsAt).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
        ) : null}

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Cole aqui o link do seu vídeo..."
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "white",
            outline: "none",
          }}
        />

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.10)",
            color: "white",
            cursor: "pointer",
          }}
        >
          {loading ? "Enviando..." : "Enviar Quest"}
        </button>

        {message ? <div style={{ marginTop: 14, color: "#9ae6b4" }}>{message}</div> : null}
        {error ? <div style={{ marginTop: 14, color: "#feb2b2" }}>❌ {error}</div> : null}

        <div style={{ marginTop: 16, opacity: 0.75, fontSize: 12 }}>
          Regras: Quest Semanal = 1 por semana (+2 Cristais). Quest Épica = 1 por evento (+5 Cristais).
        </div>
      </div>
    </AuthGate>
  );
}
