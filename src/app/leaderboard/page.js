"use client";

import AuthGate from "@/components/AuthGate";
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
        background: row.isFirstEstelar
          ? "rgba(255,215,0,0.18)"
          : "rgba(255,255,255,0.06)",
        opacity: 0.95,
        fontWeight: 800,
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
  const colLabel =
    mode === "level"
      ? "Nível"
      : mode === "season"
      ? "Cristais"
      : "Relíquias";

  const valueOf = (r) =>
    mode === "level"
      ? r.level
      : mode === "season"
      ? r.cristais
      : r.reliquiasCount;

  return (
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
          gridTemplateColumns: "70px 1fr 120px",
          padding: 12,
          opacity: 0.85,
          background: "rgba(255,255,255,0.04)",
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
            <div style={{ fontWeight: 900 }}>{r.rank}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {r.displayName || "Guardião"}
                {mode === "season" ? <TierBadge row={r} /> : null}
              </div>
            </div>

            <div style={{ textAlign: "right", fontWeight: 900, fontSize: 16 }}>
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

  const [data, setData] = useState({
    season: null,
    level: null,
    reliquias: null,
  });

  async function loadCurrent(force = false) {
    try {
      setErr("");

      if (!force && data[tab]) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const resp = await apiGet(`/api/leaderboard/${tab}?limit=50`);
      if (!resp?.ok)
        throw new Error(resp?.error || "Falha ao carregar ranking");

      setData((prev) => ({ ...prev, [tab]: resp.rows || [] }));
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive) return;
      await loadCurrent(false);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const rows = useMemo(() => data[tab] || [], [data, tab]);

  return (
    <AuthGate>
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "32px 18px",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: 34, marginBottom: 6 }}>Ranking</h1>
        <div style={{ opacity: 0.8, marginBottom: 16 }}>
          Season = ordem por Cristais Sonoros + Tier • Nível e Relíquias
          separados
        </div>

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

          <button
            onClick={() => loadCurrent(true)}
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

        {loading && <div style={{ opacity: 0.8 }}>Carregando...</div>}

        {err && (
          <div
            style={{
              border: "1px solid rgba(255,80,80,0.35)",
              padding: 12,
              borderRadius: 12,
            }}
          >
            ❌ {err}
          </div>
        )}

        {!loading && !err && <Table rows={rows} mode={tab} />}
      </div>
    </AuthGate>
  );
}