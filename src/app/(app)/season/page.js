"use client";

import AuthGate from "@/components/AuthGate";
import GVQShell from "@/components/GVQShell";
import { apiFetch, apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

function Pill({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        opacity: 0.9,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Button({ children, onClick, disabled, variant = "primary", title, style }) {
  const bg =
    variant === "ghost"
      ? "rgba(255,255,255,0.06)"
      : variant === "danger"
      ? "rgba(255,80,80,0.18)"
      : "rgba(255,255,255,0.10)";

  return (
    <button
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

function fmt(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

export default function SeasonPage() {
  const [tab, setTab] = useState("weekly"); // weekly | epic
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  // backend: /api/season/status
  const [status, setStatus] = useState(null);

  // backend: /api/season/my-submissions
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

      // backend consolidado: { weekly: [], epic: [] }
      const weeklyArr = Array.isArray(hist.weekly) ? hist.weekly : [];
      const epicArr = Array.isArray(hist.epic) ? hist.epic : [];

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
    if (!looksLikeUrl(cleaned)) return true;
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

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("📋 Link copiado!");
      setTimeout(() => setMessage(""), 1200);
    } catch {
      // fallback silencioso
    }
  }

  const right = (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <Link
        href="/dashboard"
        style={{
          textDecoration: "none",
        }}
      >
        <Button variant="ghost">← Voltar ao Dashboard</Button>
      </Link>
      <Button variant="ghost" onClick={refresh} disabled={loading}>
        🔄 Atualizar
      </Button>
    </div>
  );

  return (
    <AuthGate>
      <GVQShell
        title="Season Quests"
        subtitle="Envie o link do seu vídeo (YouTube / Shorts / TikTok / Instagram)."
        right={right}
      >
        {/* Status */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Pill>Semana: {status?.weekKey || "—"}</Pill>
          {status?.weekly?.alreadySubmitted ? <Pill>✅ Semanal enviada</Pill> : <Pill>🟡 Semanal disponível</Pill>}
          {status?.epic?.active ? (
            status?.epic?.alreadySubmitted ? <Pill>✅ Épica enviada</Pill> : <Pill>🔥 Épica ativa</Pill>
          ) : (
            <Pill>⚫ Sem Épica ativa</Pill>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Button
            onClick={() => setTab("weekly")}
            variant={tab === "weekly" ? "primary" : "ghost"}
          >
            🧭 Quest Semanal
          </Button>

          <Button
            onClick={() => status?.epic?.active && setTab("epic")}
            disabled={!status?.epic?.active}
            variant={tab === "epic" ? "primary" : "ghost"}
            title={!status?.epic?.active ? "Não há Quest Épica ativa no momento." : "Quest Épica disponível"}
          >
            ⚔️ Quest Épica
          </Button>
        </div>

        {/* Epic banner */}
        {tab === "epic" && status?.epic?.active && status?.epic?.event ? (
          <div style={{ marginTop: 12 }}>
            <Card>
              <div style={{ fontWeight: 900, fontSize: 16 }}>🔥 {status.epic.event.title}</div>
              <div style={{ opacity: 0.8, fontSize: 13, marginTop: 6 }}>
                Evento ativo até: {fmt(status.epic.event.endsAt)}
              </div>
              {status?.epic?.alreadySubmitted ? (
                <div style={{ marginTop: 10, opacity: 0.9, fontSize: 13 }}>
                  ✅ Você já enviou esta Épica.
                </div>
              ) : null}
            </Card>
          </div>
        ) : null}

        {/* Submit */}
        <div style={{ marginTop: 12 }}>
          <Card>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              {tab === "weekly" ? "Envio da Quest Semanal" : "Envio da Quest Épica"}
            </div>

            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Cole aqui o link do seu vídeo..."
            />

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <Button
                onClick={submit}
                disabled={submitDisabled}
                title={
                  !link.trim()
                    ? "Cole o link do seu vídeo."
                    : !looksLikeUrl(link.trim())
                    ? "Cole o link completo (https://...)."
                    : tab === "weekly"
                    ? weeklyDisabled
                      ? "Você já enviou a Quest Semanal desta semana."
                      : "Enviar Quest Semanal"
                    : epicDisabled
                    ? "Épica indisponível (ou já enviada)."
                    : "Enviar Quest Épica"
                }
                style={{ flex: 1, minWidth: 220 }}
              >
                {loading ? "Enviando..." : tab === "weekly" ? "Enviar Quest" : "Enviar Quest Épica"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setLink("");
                  setMessage("");
                  setError("");
                }}
                disabled={loading && !link}
                title="Limpar campo"
              >
                Limpar
              </Button>
            </div>

            {message ? <div style={{ marginTop: 12, color: "#9ae6b4" }}>{message}</div> : null}
            {error ? <div style={{ marginTop: 12, color: "#feb2b2" }}>❌ {error}</div> : null}

            <div style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
              Regras: Quest Semanal = 1 por semana (+2 Cristais). Quest Épica = 1 por evento (+5 Cristais).
            </div>
          </Card>
        </div>

        {/* History */}
        <div style={{ marginTop: 18 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Minhas submissões</div>
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4 }}>
                  Últimas {Math.min(history?.length || 0, 30)} atividades.
                </div>
              </div>
              <Pill>Total: {history?.length || 0}</Pill>
            </div>

            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <div
                style={{
                  minWidth: 860,
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "170px 240px 1fr 140px",
                    padding: 12,
                    opacity: 0.85,
                    background: "rgba(255,255,255,0.04)",
                    fontSize: 12,
                  }}
                >
                  <div>Data</div>
                  <div>Tipo</div>
                  <div>Link</div>
                  <div>Ações</div>
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
                          gridTemplateColumns: "170px 240px 1fr 140px",
                          padding: 12,
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ opacity: 0.9, fontSize: 13 }}>{fmt(r.createdAt)}</div>
                        <div style={{ fontWeight: 900, fontSize: 13 }}>{tipo}</div>

                        <div style={{ opacity: 0.95, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.link ? (
                            <a href={r.link} target="_blank" rel="noreferrer" style={{ color: "white", opacity: 0.9 }}>
                              {r.link}
                            </a>
                          ) : (
                            "—"
                          )}
                        </div>

                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <Button
                            variant="ghost"
                            disabled={!r.link}
                            onClick={() => r.link && window.open(r.link, "_blank", "noreferrer")}
                            title="Abrir link"
                            style={{ padding: "8px 10px" }}
                          >
                            ↗
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={!r.link}
                            onClick={() => r.link && copyToClipboard(r.link)}
                            title="Copiar link"
                            style={{ padding: "8px 10px" }}
                          >
                            📋
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 12, opacity: 0.8 }}>Sem submissões ainda.</div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </GVQShell>
    </AuthGate>
  );
}