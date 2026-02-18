"use client";

import { useEffect, useState } from "react";
import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";

export default function SeasonPage() {
  const [type, setType] = useState("season"); // season | epic
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState(null);
  const [eventSlug, setEventSlug] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const r = await apiGet("/api/season/epic-active").catch(() => null);
      if (r?.ok) {
        setEvent(r.event || null);
        setEventSlug(r?.event?.slug || "");
      }
    }
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);

    try {
      const body = { type, url: url.trim() };
      if (type === "epic") body.eventSlug = eventSlug;

      const r = await apiFetch("/api/season/submit", {
        method: "POST",
        auth: true,
        body,
      });

      setMsg(type === "season"
        ? "✅ Quest da semana enviada! (1 por semana)"
        : "✅ Quest Épica enviada! (1 por evento)"
      );
      setUrl("");
    } catch (e) {
      setErr(e?.message || "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: 32, color: "white" }}>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Season Quests</h1>
        <div style={{ opacity: 0.75, marginBottom: 18 }}>
          Envie o link do seu vídeo (YouTube / Shorts / etc).
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setType("season")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                opacity: type === "season" ? 1 : 0.6,
                cursor: "pointer",
              }}
            >
              📅 Quest Semanal
            </button>

            <button
              type="button"
              onClick={() => setType("epic")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                opacity: type === "epic" ? 1 : 0.6,
                cursor: "pointer",
              }}
              disabled={!eventSlug}
              title={!eventSlug ? "Nenhuma Quest Épica ativa agora" : ""}
            >
              ⚔️ Quest Épica
            </button>
          </div>

          {type === "epic" && (
            <div style={{ opacity: 0.85, fontSize: 14 }}>
              {eventSlug ? (
                <>Evento ativo: <b>{event?.title}</b> (slug: {eventSlug})</>
              ) : (
                <>Nenhuma Quest Épica ativa no momento.</>
              )}
            </div>
          )}

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole aqui o link (YouTube, Shorts, etc)"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading || !url.trim() || (type === "epic" && !eventSlug)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Enviando..." : "Enviar Quest"}
          </button>

          {msg ? <div style={{ color: "#8ef0b3" }}>{msg}</div> : null}
          {err ? <div style={{ color: "#ff8b8b" }}>❌ {err}</div> : null}
        </form>
      </div>
    </AuthGate>
  );
}
