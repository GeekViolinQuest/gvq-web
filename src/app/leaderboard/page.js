"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function LeaderboardPage() {
  const [tab, setTab] = useState("level"); // "level" | "cristais"
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function load(t) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/leaderboard?type=${t}&limit=50`);
      setData(res);
    } catch (e) {
      setError(e?.message || "Erro ao carregar leaderboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filtered = useMemo(() => {
    const items = data?.items || [];
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter((it) =>
      String(it.displayName || "").toLowerCase().includes(query)
    );
  }, [data, q]);

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      <h1>Leaderboard</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Ranking público (sem e-mails / IDs).
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={() => setTab("level")}
          style={{
            padding: "10px 14px",
            cursor: "pointer",
            border: "1px solid #333",
            borderRadius: 8,
            opacity: tab === "level" ? 1 : 0.6,
          }}
        >
          🧙 Nível
        </button>
        <button
          onClick={() => setTab("cristais")}
          style={{
            padding: "10px 14px",
            cursor: "pointer",
            border: "1px solid #333",
            borderRadius: 8,
            opacity: tab === "cristais" ? 1 : 0.6,
          }}
        >
          💎 Cristais
        </button>
      </div>

      {/* Busca */}
      <div style={{ marginTop: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar pelo nome..."
          style={{
            width: "100%",
            padding: 10,
            fontSize: 16,
            borderRadius: 8,
            border: "1px solid #333",
          }}
        />
      </div>

      {/* Estado */}
      {loading && <p style={{ marginTop: 18 }}>Carregando...</p>}
      {error && <p style={{ marginTop: 18, color: "red" }}>{error}</p>}

      {/* Tabela */}
      {!loading && !error && (
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "70px 1fr 140px",
              gap: 10,
              padding: "10px 12px",
              borderBottom: "1px solid #333",
              opacity: 0.8,
              fontWeight: 600,
            }}
          >
            <div>#</div>
            <div>Guardião</div>
            <div style={{ textAlign: "right" }}>
              {tab === "level" ? "Nível" : "Cristais"}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p style={{ marginTop: 16, opacity: 0.8 }}>Nenhum resultado.</p>
          ) : (
            filtered.map((it) => (
              <div
                key={`${it.rank}-${it.displayName}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr 140px",
                  gap: 10,
                  padding: "10px 12px",
                  borderBottom: "1px solid #222",
                }}
              >
                <div style={{ opacity: 0.9 }}>{it.rank}</div>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                  {it.displayName}
                </div>
                <div style={{ textAlign: "right" }}>
                  {tab === "level" ? it.level : it.cristais}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Refresh manual */}
      <div style={{ marginTop: 18 }}>
        <button
          onClick={() => load(tab)}
          style={{
            padding: 10,
            cursor: "pointer",
            border: "1px solid #333",
            borderRadius: 8,
            opacity: 0.9,
          }}
        >
          🔄 Atualizar
        </button>
      </div>
    </div>
  );
}
