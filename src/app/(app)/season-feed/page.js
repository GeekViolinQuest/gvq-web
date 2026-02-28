"use client";

import AuthGate from "@/components/AuthGate";
import GVQShell from "@/components/GVQShell";
import LoadingDots from "@/components/LoadingDots";
import { apiFetch } from "@/lib/api";
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

function Button({ children, onClick, disabled, variant = "solid" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: variant === "solid" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        fontWeight: 900,
      }}
    >
      {children}
    </button>
  );
}

function getISOWeekKey(date = new Date()) {
  // mesma lógica que vocês usam: simplificada (funciona ok pra UI)
  // (se quiser 100% igual ao backend, eu te passo a versão completa)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function isYouTube(url) {
  return /youtube\.com|youtu\.be/i.test(url || "");
}

function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "");
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    // shorts
    const m = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    return null;
  } catch {
    return null;
  }
}

function Embed({ link }) {
  if (isYouTube(link)) {
    const id = extractYouTubeId(link);
    if (id) {
      return (
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)" }}>
          <iframe
            width="100%"
            height="360"
            src={`https://www.youtube.com/embed/${id}`}
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 0, display: "block" }}
          />
        </div>
      );
    }
  }

  // fallback: link normal
  return (
    <a href={link} target="_blank" rel="noreferrer" style={{ color: "white", opacity: 0.9 }}>
      Abrir link
    </a>
  );
}

export default function SeasonGaleriaPage() {
  const [tab, setTab] = useState("season"); // season | epico
  const [weekKey, setWeekKey] = useState(getISOWeekKey(new Date()));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);
  const [err, setErr] = useState("");
  const [nextBefore, setNextBefore] = useState(null);

  const title = useMemo(() => (tab === "season" ? "Season Quests" : "Quests Épicas"), [tab]);

  async function loadFirst() {
    setLoading(true);
    setErr("");
    setItems([]);
    setNextBefore(null);

    const qs = new URLSearchParams();
    qs.set("type", tab === "epico" ? "epic" : "season");
    if (tab === "season") qs.set("weekKey", weekKey);
    qs.set("limit", "20");

    const r = await apiFetch(`/api/season/feed?${qs.toString()}`, { method: "GET", auth: true });
    if (!r?.ok) {
      setErr(r?.error || "Falha ao carregar feed");
      setLoading(false);
      return;
    }

    setItems(r.items || []);
    setNextBefore(r.nextBefore || null);
    setLoading(false);
  }

  async function loadMore() {
    if (!nextBefore) return;
    setMoreLoading(true);
    setErr("");

    const qs = new URLSearchParams();
    qs.set("type", tab === "epico" ? "epic" : "season");
    if (tab === "season") qs.set("weekKey", weekKey);
    qs.set("limit", "20");
    qs.set("before", nextBefore);

    const r = await apiFetch(`/api/season/feed?${qs.toString()}`, { method: "GET", auth: true });
    if (!r?.ok) {
      setErr(r?.error || "Falha ao carregar mais");
      setMoreLoading(false);
      return;
    }

    setItems((prev) => [...prev, ...(r.items || [])]);
    setNextBefore(r.nextBefore || null);
    setMoreLoading(false);
  }

  useEffect(() => {
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, weekKey]);

  return (
    <AuthGate>
      <GVQShell title={`Galeria — ${title}`} subtitle="Veja os envios dos Guardiões (links postados nas Quests).">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <Button variant={tab === "season" ? "solid" : "ghost"} onClick={() => setTab("season")} disabled={loading}>
            🎻 Quest da Semana
          </Button>
          <Button variant={tab === "epico" ? "solid" : "ghost"} onClick={() => setTab("epico")} disabled={loading}>
            ⚔️ Quest Épica
          </Button>

          {tab === "season" ? (
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ opacity: 0.8, fontSize: 13 }}>Semana:</div>
              <input
                value={weekKey}
                onChange={(e) => setWeekKey(e.target.value)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "white",
                  outline: "none",
                }}
                placeholder="2026-W08"
              />
            </div>
          ) : null}
        </div>

        {loading ? <LoadingDots label="Carregando galeria" /> : null}
        {err ? (
          <div style={{ border: "1px solid rgba(255,80,80,0.35)", padding: 12, borderRadius: 12 }}>
            ❌ {err}
          </div>
        ) : null}

        {!loading ? (
          <div style={{ display: "grid", gap: 12 }}>
            {items?.length ? (
              items.map((it) => (
                <Card key={it.id}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it?.user?.avatarUrl || "/avatar-placeholder.png"}
                        alt="avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/avatar-placeholder.png";
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 1000 }}>{it?.user?.displayName || "Guardião"}</div>
                      <div style={{ opacity: 0.75, fontSize: 12 }}>
                        {it.type === "season" ? `🎻 ${it.weekKey || ""}` : "⚔️ Épica"} •{" "}
                        {it.createdAt ? new Date(it.createdAt).toLocaleString("pt-BR") : ""}
                      </div>
                    </div>

                    <a
                      href={it.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "white", opacity: 0.9, textDecoration: "none" }}
                    >
                      Abrir ↗
                    </a>
                  </div>

                  <Embed link={it.link} />
                </Card>
              ))
            ) : (
              <div style={{ opacity: 0.8 }}>Ainda não tem envios para esse filtro.</div>
            )}

            {nextBefore ? (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
                <Button onClick={loadMore} disabled={moreLoading}>
                  {moreLoading ? "Carregando..." : "Carregar mais"}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </GVQShell>
    </AuthGate>
  );
}