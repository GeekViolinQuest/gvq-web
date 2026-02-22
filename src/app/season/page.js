"use client";

import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

function looksLikeUrl(s) {
  try {
    const u = new URL(String(s || "").trim());
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

export default function SeasonPage() {
  const [tab, setTab] = useState("weekly"); // weekly | epic
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const [weekly, setWeekly] = useState({
    loading: true,
    weekKey: null,
    alreadySubmitted: false,
    submission: null,
  });

  const [epicInfo, setEpicInfo] = useState({
    loading: true,
    active: false,
    event: null,
    alreadySubmitted: false,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadWeeklyStatus(signal) {
    try {
      setWeekly((p) => ({ ...p, loading: true }));

      const r = await apiGet("/api/season/weekly-status", { signal });
      if (!r?.ok) throw new Error(r?.error || "Falha ao checar Quest Semanal");

      setWeekly({
        loading: false,
        weekKey: r.weekKey || null,
        alreadySubmitted: !!r.alreadySubmitted,
        submission: r.submission || null,
      });
    } catch (e) {
      if (e?.name === "AbortError") return;
      setWeekly({ loading: false, weekKey: null, alreadySubmitted: false, submission: null });
    }
  }

  async function loadEpic(signal) {
    try {
      setEpicInfo({ loading: true, active: false, event: null, alreadySubmitted: false });

      const r = await apiGet("/api/season/epic-active", { signal });
      if (!r?.ok) throw new Error(r?.error || "Falha ao checar Quest Épica");

      // compat com os dois formatos:
      // A) { ok, active, event, alreadySubmitted }
      // B) { ok, event: null | {...}, alreadySubmitted }
      const active = typeof r.active === "boolean" ? r.active : !!r.event;

      setEpicInfo({
        loading: false,
        active,
        event: r.event || null,
        alreadySubmitted: !!r.alreadySubmitted,
      });

      if (!active) setTab("weekly");
    } catch (e) {
      if (e?.name === "AbortError") return;
      setEpicInfo({ loading: false, active: false, event: null, alreadySubmitted: false });
    }
  }

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      await Promise.all([loadWeeklyStatus(ac.signal), loadEpic(ac.signal)]);
    })();

    return () => ac.abort();
  }, []);

  const epicDisabled = useMemo(() => {
    if (epicInfo.loading) return true;
    return !epicInfo.active; // botão de tab épica bloqueia só se não estiver ativa
  }, [epicInfo]);

  const weeklyDisabled = useMemo(() => {
    if (weekly.loading) return true;
    return !!weekly.alreadySubmitted;
  }, [weekly]);

  const submitDisabled = useMemo(() => {
    const cleaned = link.trim();

    if (loading) return true;
    if (!cleaned) return true;

    if (tab === "weekly") return weeklyDisabled;
    // épica: se não ativa ou já enviada
    return epicDisabled || epicInfo.alreadySubmitted;
  }, [loading, link, tab, weeklyDisabled, epicDisabled, epicInfo.alreadySubmitted]);

  async function refreshAll() {
    setMessage("");
    setError("");
    const ac = new AbortController();

    // não precisa guardar controller global; só evita duplicar setState
    await Promise.all([loadWeeklyStatus(ac.signal), loadEpic(ac.signal)]);
  }

  async function submit() {
    setLoading(true);
    setMessage("");
    setError("");

    const cleaned = link.trim();
    if (!cleaned) {
      setLoading(false);
      setError("Cole o link do seu vídeo.");
      return;
    }

    // validação leve (backend é a fonte da verdade)
    if (!looksLikeUrl(cleaned)) {
      setLoading(false);
      setError("Esse link não parece uma URL válida. Cole o link completo (https://...).");
      return;
    }

    try {
      const endpoint = tab === "weekly" ? "/api/season/submit" : "/api/season/epic-submit";

      const r = await apiFetch(endpoint, {
        method: "POST",
        auth: true,
        body: { link: cleaned },
      });

      if (!r?.ok) throw new Error(r?.error || "Falha ao enviar");

      // ✅ IMPORTANTE: backend novo manda type "season" (weekly) e "epic" (épica)
      // então decidimos pelo TAB, não pelo r.type
      if (tab === "weekly") {
        const gained = r.gained ?? 2;
        const total = r.newCristais ?? "—";
        const bonus = r.firstEstelar ? " 🌟 Você foi o PRIMEIRO ESTELAR desta Season!" : "";
        setMessage(`✅ Quest Semanal registrada! (+${gained} Cristais) • Total: ${total} 💎${bonus}`);
        await loadWeeklyStatus();
      } else {
        const gained = r.gained ?? 5;
        const total = r.newCristais ?? "—";
        const title = r?.event?.title ? ` — ${r.event.title}` : "";
        const bonus = r.firstEstelar ? " 🌟 Você foi o PRIMEIRO ESTELAR desta Season!" : "";
        setMessage(`🔥 Quest Épica registrada${title}! (+${gained} Cristais) • Total: ${total} 💎${bonus}`);
        await loadEpic();
      }

      setLink("");
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
          Envie o link do seu vídeo (YouTube / Shorts / TikTok / Instagram).
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
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
            title={epicDisabled ? "Não há Quest Épica ativa no momento." : "Quest Épica disponível"}
          >
            ⚔️ Quest Épica
          </button>

          <button
            onClick={refreshAll}
            style={{
              marginLeft: "auto",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
            }}
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Info semanal */}
        {tab === "weekly" ? (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              background: "rgba(255,255,255,0.03)",
              opacity: weekly.loading ? 0.8 : 1,
            }}
          >
            <div style={{ fontWeight: 800 }}>📌 Semana atual: {weekly.weekKey || "—"}</div>
            {weekly.alreadySubmitted ? (
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                ✅ Você já enviou a Quest Semanal desta semana.
                {weekly.submission?.link ? (
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8, wordBreak: "break-word" }}>
                    Link enviado: {weekly.submission.link}
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                Você ainda não enviou nesta semana. Envie seu link abaixo. (+2 Cristais)
              </div>
            )}
          </div>
        ) : null}

        {/* Info épica */}
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

            {epicInfo.alreadySubmitted ? (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                ✅ Você já enviou esta Quest Épica.
              </div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                Envie seu link abaixo. (+5 Cristais)
              </div>
            )}
          </div>
        ) : null}

        {/* Input */}
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
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
          disabled={submitDisabled}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.10)",
            color: "white",
            cursor: submitDisabled ? "not-allowed" : "pointer",
            opacity: submitDisabled ? 0.5 : 1,
          }}
        >
          {loading
            ? "Enviando..."
            : tab === "weekly" && weekly.alreadySubmitted
            ? "Quest Semanal já enviada"
            : tab === "epic" && epicInfo.alreadySubmitted
            ? "Quest Épica já enviada"
            : "Enviar Quest"}
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