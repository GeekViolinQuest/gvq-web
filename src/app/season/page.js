"use client";

import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

function Pill({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        opacity: 0.9,
      }}
    >
      {children}
    </span>
  );
}

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

  // status unificado (backend: /api/season/status)
  const [status, setStatus] = useState(null);

  // histórico unificado (backend: /api/season/my-submissions)
  const [history, setHistory] = useState([]); // [{id,type,createdAt,weekKey,event?,link}]

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAll(signal) {
    setError("");

    try {
      const [st, hist] = await Promise.all([
        apiGet("/api/season/status", { signal }),
        apiGet("/api/season/my-submissions?limit=30", { signal }),
      ]);

      if (!st?.ok) throw new Error(st?.error || "Falha ao carregar status");
      if (!hist?.ok) throw new Error(hist?.error || "Falha ao carregar histórico");

      setStatus(st);

      // ✅ backend consolidado retorna { weekly: [], epic: [] }
      const weeklyArr = Array.isArray(hist.weekly) ? hist.weekly : [];
      const epicArr = Array.isArray(hist.epic) ? hist.epic : [];

      // normaliza em uma lista única
      const merged = [
        ...weeklyArr.map((r) => ({
          id: r.id,
          type: "weekly",
          createdAt: r.createdAt,
          weekKey: r.weekKey || null,
          link: r.link || null,
          event: null,
        })),
        ...epicArr.map((r) => ({
          id: r.id,
          type: "epic",
          createdAt: r.createdAt,
          weekKey: null,
          link: r.link || null,
          event: r.event || null, // {id,title,slug} (ou {id})
        })),
      ].sort((a, b) => {
        const da = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });

      setHistory(merged);

      // se não tem épica ativa, força aba semanal
      if (!st?.epic?.active) setTab("weekly");
    } catch (e) {
      if (e?.name === "AbortError") return;
      setStatus(null);
      setHistory([]);
      setError(e?.message || "Erro ao carregar");
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    loadAll(ac.signal);
    return () => ac.abort();
  }, []);

  const weeklyDisabled = useMemo(() => {
    return !!status?.weekly?.alreadySubmitted;
  }, [status]);

  const epicDisabled = useMemo(() => {
    if (!status?.epic?.active) return true;
    if (status?.epic?.alreadySubmitted) return true;
    return false;
  }, [status]);

  const submitDisabled = useMemo(() => {
    const cleaned = link.trim();
    if (loading) return true;
    if (!cleaned) return true;
    if (tab === "weekly") return weeklyDisabled;
    return epicDisabled;
  }, [loading, link, tab, weeklyDisabled, epicDisabled]);

  async function refresh() {
    setMessage("");
    setError("");
    const ac = new AbortController();
    await loadAll(ac.signal);
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

      // ✅ Decide pelo TAB (mais estável do que confiar em r.type)
      const gained = tab === "weekly" ? (r.gained ?? 2) : (r.gained ?? 5);
      const total = r.newCristais ?? "—";
      const bonus = r.firstEstelar ? " 🌟 Você foi o PRIMEIRO ESTELAR desta Season!" : "";

      if (tab === "weekly") {
        setMessage(`✅ Quest Semanal registrada! (+${gained} Cristais) • Total: ${total} 💎${bonus}`);
      } else {
        const title = r?.event?.title ? ` — ${r.event.title}` : "";
        setMessage(`🔥 Quest Épica registrada${title}! (+${gained} Cristais) • Total: ${total} 💎${bonus}`);
      }

      setLink("");
      await refresh();
    } catch (e) {
      setError(e?.message || "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>Season Quests</h1>
            <div style={{ opacity: 0.8 }}>
              Envie o link do seu vídeo (YouTube / Shorts / TikTok / Instagram).
            </div>
          </div>

          <button
            onClick={refresh}
            style={{
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

        {/* status pills */}
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.9 }}>
          <Pill>Semana: {status?.weekKey || "—"}</Pill>
          {status?.weekly?.alreadySubmitted ? <Pill>✅ Semanal enviada</Pill> : <Pill>🟡 Semanal disponível</Pill>}
          {status?.epic?.active ? (
            status?.epic?.alreadySubmitted ? <Pill>✅ Épica enviada</Pill> : <Pill>🔥 Épica ativa</Pill>
          ) : (
            <Pill>⚫ Sem Épica ativa</Pill>
          )}
        </div>

        {/* abas */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
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
            onClick={() => !(!status?.epic?.active) && setTab("epic")}
            disabled={!status?.epic?.active}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: tab === "epic" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              color: "white",
              opacity: !status?.epic?.active ? 0.35 : 1,
              cursor: !status?.epic?.active ? "not-allowed" : "pointer",
            }}
            title={!status?.epic?.active ? "Não há Quest Épica ativa no momento." : "Quest Épica disponível"}
          >
            ⚔️ Quest Épica
          </button>
        </div>

        {/* banner épica */}
        {tab === "epic" && status?.epic?.active && status?.epic?.event ? (
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              padding: 12,
              marginTop: 12,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontWeight: 900 }}>🔥 {status.epic.event.title}</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 4 }}>
              Evento ativo até:{" "}
              {status.epic.event.endsAt ? new Date(status.epic.event.endsAt).toLocaleString("pt-BR") : "—"}
            </div>

            {status?.epic?.alreadySubmitted ? (
              <div style={{ marginTop: 8, opacity: 0.9, fontSize: 13 }}>✅ Você já enviou esta Épica.</div>
            ) : null}
          </div>
        ) : null}

        {/* input */}
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
            marginTop: 12,
          }}
        />

        {/* botão enviar */}
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
          title={
            tab === "weekly"
              ? weeklyDisabled
                ? "Você já enviou a Quest Semanal desta semana."
                : "Enviar Quest Semanal"
              : epicDisabled
              ? "Épica indisponível (ou já enviada)."
              : "Enviar Quest Épica"
          }
        >
          {loading ? "Enviando..." : tab === "weekly" ? "Enviar Quest" : "Enviar Quest Épica"}
        </button>

        {message ? <div style={{ marginTop: 14, color: "#9ae6b4" }}>{message}</div> : null}
        {error ? <div style={{ marginTop: 14, color: "#feb2b2" }}>❌ {error}</div> : null}

        <div style={{ marginTop: 16, opacity: 0.75, fontSize: 12 }}>
          Regras: Quest Semanal = 1 por semana (+2 Cristais). Quest Épica = 1 por evento (+5 Cristais).
        </div>

        {/* histórico */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Minhas submissões</h2>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 180px 1fr",
                padding: 12,
                opacity: 0.85,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <div>Data</div>
              <div>Tipo</div>
              <div>Link</div>
            </div>

            {history?.length ? (
              history.map((r) => {
                const tipo =
                  r.type === "weekly"
                    ? `Semanal${r.weekKey ? ` (${r.weekKey})` : ""}`
                    : r.type === "epic"
                    ? `Épica${r.event?.title ? ` — ${r.event.title}` : ""}`
                    : r.type;

                return (
                  <div
                    key={r.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "160px 180px 1fr",
                      padding: 12,
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ opacity: 0.9, fontSize: 13 }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "—"}
                    </div>

                    <div style={{ fontWeight: 900 }}>{tipo}</div>

                    <div style={{ opacity: 0.95, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.link ? (
                        <a href={r.link} target="_blank" rel="noreferrer" style={{ color: "white", opacity: 0.9 }}>
                          {r.link}
                        </a>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 12, opacity: 0.8 }}>Sem submissões ainda.</div>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}