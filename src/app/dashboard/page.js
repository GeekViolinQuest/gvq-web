"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { apiFetch, clearToken } from "@/lib/api";

function Button({ onClick, children, variant = "solid", disabled = false }) {
  const base = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: disabled ? "not-allowed" : "pointer",
    color: "white",
    fontWeight: 800,
    opacity: disabled ? 0.6 : 1,
    background: variant === "solid" ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
  };

  return (
    <button onClick={onClick} disabled={disabled} style={base}>
      {children}
    </button>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 14,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ opacity: 0.75, fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const router = useRouter();

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const res = await apiFetch("/api/user/me", { auth: true });
      setData(res);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      setData(null);
      setErr(e?.message || "Falha ao carregar /me");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  const user = data?.user || {};
  const progress = data?.progress || {};

  const displayName = user?.displayName || "Guardião";
  const email = user?.email || "";

  const isLinkedDiscord = !!user?.discordId; // só informativo (legado)

  return (
    <AuthGate>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>Dashboard</h1>
            <div style={{ opacity: 0.8 }}>
              {displayName} · {email}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={load} variant="ghost" disabled={loading}>
              🔄 Atualizar
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              Sair
            </Button>
          </div>
        </div>

        {loading ? <div style={{ marginTop: 14, opacity: 0.8 }}>Carregando...</div> : null}

        {err ? (
          <div
            style={{
              marginTop: 14,
              border: "1px solid rgba(255,80,80,0.35)",
              padding: 12,
              borderRadius: 12,
            }}
          >
            ❌ {err}
          </div>
        ) : null}

        {!loading && data?.ok ? (
          <>
            {/* HUB de navegação */}
            <div style={{ marginTop: 16 }}>
              <div style={{ opacity: 0.8, marginBottom: 10 }}>
                Ações rápidas
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button onClick={() => router.push("/perfil")}>👤 Perfil</Button>
                <Button onClick={() => router.push("/resgatar")}>🎟️ Resgatar código</Button>
                <Button onClick={() => router.push("/season")}>🧭 Season Quests</Button>
                <Button onClick={() => router.push("/leaderboard")}>🏆 Leaderboard</Button>
                <Button onClick={() => router.push("/forum")}>💬 Comunidade</Button>
              </div>
            </div>

            {/* Cards com stats */}
            <div
              style={{
                marginTop: 18,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              <StatCard label="Nível" value={progress.level ?? 0} />
              <StatCard label="Cristais Sonoros" value={progress.cristais ?? 0} />
              <StatCard label="Runas" value={(progress.runas || []).length} />
              <StatCard label="Relíquias" value={(progress.reliquias || []).length} />
            </div>

            {/* status/legado do Discord (informativo) */}
            <div
              style={{
                marginTop: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 12,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Status</div>
              <div style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.45 }}>
                {isLinkedDiscord ? (
                  <>✅ Discord vinculado (legado/migração): <span style={{ opacity: 0.95 }}>{user.discordId}</span></>
                ) : (
                  <>ℹ️ Discord não vinculado (ok). O site funciona independente disso.</>
                )}
              </div>
            </div>

            {/* Últimas conquistas (códigos crus — depois a gente troca pelo nome do catálogo se quiser) */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>Últimas conquistas</div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: 12,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Runas (últimas 5)</div>
                  <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
                    {[...(progress.runas || [])].slice(-5).reverse().map((r, idx) => (
                      <li key={`${r}-${idx}`}>{r}</li>
                    ))}
                    {(!progress.runas || progress.runas.length === 0) ? (
                      <li style={{ opacity: 0.7 }}>Nenhuma ainda</li>
                    ) : null}
                  </ul>
                </div>

                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: 12,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Relíquias (últimas 5)</div>
                  <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
                    {[...(progress.reliquias || [])].slice(-5).reverse().map((r, idx) => (
                      <li key={`${r}-${idx}`}>{r}</li>
                    ))}
                    {(!progress.reliquias || progress.reliquias.length === 0) ? (
                      <li style={{ opacity: 0.7 }}>Nenhuma ainda</li>
                    ) : null}
                  </ul>
                </div>

                <div
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    padding: 12,
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 900, marginBottom: 8 }}>Bônus (últimos 5)</div>
                  <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.9 }}>
                    {[...(progress.bonus || [])].slice(-5).reverse().map((b, idx) => (
                      <li key={`${b}-${idx}`}>{b}</li>
                    ))}
                    {(!progress.bonus || progress.bonus.length === 0) ? (
                      <li style={{ opacity: 0.7 }}>Nenhum ainda</li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {!loading && !data?.ok ? (
          <div style={{ marginTop: 14, opacity: 0.85 }}>
            Não foi possível carregar os dados do dashboard.
          </div>
        ) : null}
      </div>
    </AuthGate>
  );
}