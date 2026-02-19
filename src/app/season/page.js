"use client";

import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";
import { useEffect, useState } from "react";

export default function SeasonPage() {
  const [linkSeason, setLinkSeason] = useState("");
  const [seasonMsg, setSeasonMsg] = useState(null);
  const [seasonErr, setSeasonErr] = useState(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  const [epic, setEpic] = useState(null);
  const [linkEpic, setLinkEpic] = useState("");
  const [epicMsg, setEpicMsg] = useState(null);
  const [epicErr, setEpicErr] = useState(null);
  const [loadingEpic, setLoadingEpic] = useState(false);

  async function loadEpic() {
    const r = await apiGet("/api/season/epic-active");
    if (r?.ok) setEpic(r);
    else setEpic({ ok: false, error: r?.error || "Falha ao carregar épica" });
  }

  useEffect(() => {
    loadEpic();
  }, []);

  async function submitSeason(e) {
    e.preventDefault();
    setLoadingSeason(true);
    setSeasonMsg(null);
    setSeasonErr(null);

    try {
      const res = await apiFetch("/api/season/submit", {
        method: "POST",
        auth: true,
        body: { link: linkSeason.trim() },
      });

      setSeasonMsg(`✅ Season enviada! Semana: ${res.weekKey}`);
      setLinkSeason("");
    } catch (err) {
      setSeasonErr(err?.message || "Erro ao enviar");
    } finally {
      setLoadingSeason(false);
    }
  }

  async function submitEpic(e) {
    e.preventDefault();
    setLoadingEpic(true);
    setEpicMsg(null);
    setEpicErr(null);

    try {
      const res = await apiFetch("/api/season/epic-submit", {
        method: "POST",
        auth: true,
        body: { link: linkEpic.trim() },
      });

      setEpicMsg(`🏆 Quest Épica enviada: ${res?.event?.title || "OK"}`);
      setLinkEpic("");
      await loadEpic();
    } catch (err) {
      setEpicErr(err?.message || "Erro ao enviar épica");
    } finally {
      setLoadingEpic(false);
    }
  }

  const epicEvent = epic?.event || null;
  const alreadyEpic = !!epic?.alreadySubmitted;

  return (
    <AuthGate>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <h1 style={{ fontSize: 34, marginBottom: 6 }}>Season Quests</h1>
        <div style={{ opacity: 0.8, marginBottom: 22 }}>
          Envie sua mídia por link (YouTube/Shorts, etc.). 1 envio por semana.
        </div>

        {/* Season semanal */}
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 16 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Quest da Semana</h2>
          <div style={{ opacity: 0.8, marginTop: 6, fontSize: 13 }}>
            Regra: 1 envio por semana por Guardião.
          </div>

          <form onSubmit={submitSeason} style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <input
              value={linkSeason}
              onChange={(e) => setLinkSeason(e.target.value)}
              placeholder="Cole o link do vídeo aqui..."
              style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "white" }}
            />
            <button
              type="submit"
              disabled={loadingSeason}
              style={{ padding: 12, borderRadius: 10, cursor: "pointer" }}
            >
              {loadingSeason ? "Enviando..." : "Enviar Season"}
            </button>
          </form>

          {seasonMsg ? <div style={{ marginTop: 12, color: "lightgreen" }}>{seasonMsg}</div> : null}
          {seasonErr ? <div style={{ marginTop: 12, color: "salmon" }}>❌ {seasonErr}</div> : null}
        </div>

        {/* Epic */}
        <div style={{ marginTop: 18, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 16 }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Quest Épica</h2>

          {!epicEvent ? (
            <div style={{ opacity: 0.8, marginTop: 10 }}>Nenhuma Quest Épica ativa no momento.</div>
          ) : (
            <>
              <div style={{ opacity: 0.9, marginTop: 10, fontWeight: 700 }}>{epicEvent.title}</div>
              <div style={{ opacity: 0.75, marginTop: 6, fontSize: 13 }}>
                Ativa até: {new Date(epicEvent.endsAt).toLocaleString()}
              </div>

              {alreadyEpic ? (
                <div style={{ marginTop: 10, opacity: 0.85 }}>✅ Você já enviou esta Quest Épica.</div>
              ) : (
                <form onSubmit={submitEpic} style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <input
                    value={linkEpic}
                    onChange={(e) => setLinkEpic(e.target.value)}
                    placeholder="Cole o link do vídeo da Quest Épica..."
                    style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)", color: "white" }}
                  />
                  <button
                    type="submit"
                    disabled={loadingEpic}
                    style={{ padding: 12, borderRadius: 10, cursor: "pointer" }}
                  >
                    {loadingEpic ? "Enviando..." : "Enviar Épica"}
                  </button>
                </form>
              )}

              {epicMsg ? <div style={{ marginTop: 12, color: "lightgreen" }}>{epicMsg}</div> : null}
              {epicErr ? <div style={{ marginTop: 12, color: "salmon" }}>❌ {epicErr}</div> : null}
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
