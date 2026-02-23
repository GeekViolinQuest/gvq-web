"use client";

import AuthGate from "@/components/AuthGate";
import GVQShell from "@/components/GVQShell";
import LoadingDots from "@/components/LoadingDots";
import { apiGet } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
        color: "white",
        cursor: "pointer",
        fontWeight: 900,
      }}
    >
      {children}
    </button>
  );
}

function TierBadge({ row }) {
  if (!row?.tierLabel) return null;
  const label = row.isFirstEstelar ? "👑 1º Estelar" : row.tierLabel;

  return (
    <span
      style={{
        marginLeft: 10,
        fontSize: 12,
        padding: "3px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        background: row.isFirstEstelar ? "rgba(255,215,0,0.18)" : "rgba(255,255,255,0.06)",
        opacity: 0.95,
        fontWeight: 900,
      }}
      title={
        row.isFirstEstelar
          ? "Primeiro Guardião a alcançar Tier 1 nesta Temporada."
          : `Tier ${row.tierNumber} — ${row.tierLabel}`
      }
    >
      {label}
    </span>
  );
}

function Table({ rows, mode }) {
  const colLabel = mode === "level" ? "Nível" : mode === "season" ? "Cristais" : "Relíquias";

  const valueOf = (r) =>
    mode === "level" ? r.level : mode === "season" ? r.cristais : r.reliquiasCount;

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "70px 1fr 120px",
          padding: 12,
          opacity: 0.85,
          background: "rgba(255,255,255,0.04)",
          fontWeight: 900,
        }}
      >
        <div>#</div>
        <div>Guardião</div>
        <div style={{ textAlign: "right" }}>{colLabel}</div>
      </div>

      {rows?.length ? (
        rows.map((r) => (
          <div
            key={`${mode}-${r.userId}-${r.rank}`}
            style={{
              display: "grid",
              gridTemplateColumns: "70px 1fr 120px",
              padding: 12,
              borderTop: "1px solid rgba(255,255,255,0.08)",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 1000 }}>{r.rank}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontWeight: 900, display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                {r.displayName || "Guardião"}
                {mode === "season" ? <TierBadge row={r} /> : null}
              </div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {mode === "season" ? `Nível ${r.level} • Relíquias ${r.reliquiasCount}` : `Cristais ${r.cristais}`}
              </div>
            </div>

            <div style={{ textAlign: "right", fontWeight: 1000, fontSize: 16 }}>
              {valueOf(r)}
            </div>
          </div>
        ))
      ) : (
        <div style={{ padding: 12, opacity: 0.8 }}>Sem dados.</div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState("season");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [data, setData] = useState({ season: null, level: null, reliquias: null });

  async function loadCurrent(force = false) {
    setErr("");

    if (!force && data[tab]) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const r = await apiGet(`/api/leaderboard/${tab}?limit=50&page=1`, { auth: true });

    if (!r.ok) {
      setErr(r.error || "Falha ao carregar ranking");
      setLoading(false);
      return;
    }

    setData((prev) => ({ ...prev, [tab]: r.data?.rows || [] }));
    setLoading(false);
  }

  useEffect(() => {
    loadCurrent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const rows = useMemo(() => data[tab] || [], [data, tab]);

  return (
    <AuthGate>
      <GVQShell
        title="Ranking"
        subtitle="Season = Cristais + Tier • Nível e Relíquias separados"
        right={
          <button
            onClick={() => loadCurrent(true)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            🔄 Atualizar
          </button>
        }
      >
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <TabButton active={tab === "season"} onClick={() => setTab("season")}>
            💎 Ranking da Season
          </TabButton>

          <TabButton active={tab === "level"} onClick={() => setTab("level")}>
            ⭐ Ranking de Nível
          </TabButton>

          <TabButton active={tab === "reliquias"} onClick={() => setTab("reliquias")}>
            🏆 Ranking de Relíquias
          </TabButton>
        </div>

        {loading ? <LoadingDots label="Invocando o placar" /> : null}

        {err ? (
          <div style={{ border: "1px solid rgba(255,80,80,0.35)", padding: 12, borderRadius: 12 }}>
            ❌ {err}
          </div>
        ) : null}

        {!loading && !err ? <Table rows={rows} mode={tab} /> : null}
      </GVQShell>
    </AuthGate>
  );
}