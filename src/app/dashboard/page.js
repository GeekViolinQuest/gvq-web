"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import GVQShell from "@/components/GVQShell";
import LoadingDots from "@/components/LoadingDots";
import { apiGet, clearToken } from "@/lib/api";

function Button({ onClick, children, variant = "solid", disabled = false }) {
  const base = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: disabled ? "not-allowed" : "pointer",
    color: "white",
    fontWeight: 900,
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
        borderRadius: 14,
        padding: 14,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ opacity: 0.75, fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 1000, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const router = useRouter();

  async function load() {
    setErr("");
    setLoading(true);

    const r = await apiGet("/api/user/me", { auth: true });

    if (!r.ok) {
      setPayload(null);
      setErr(r.error || "Falha ao carregar /me");
      setLoading(false);
      return;
    }

    setPayload(r.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  const user = payload?.user || {};
  const progress = payload?.progress || {};

  const displayName = user?.displayName || "Guardião";
  const email = user?.email || "";
  const isLinkedDiscord = !!user?.discordId;

  return (
    <AuthGate>
      <GVQShell
        title="Dashboard"
        subtitle={`${displayName} · ${email}`}
        right={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={load} variant="ghost" disabled={loading}>
              🔄 Atualizar
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              Sair
            </Button>
          </div>
        }
      >
        {loading ? <LoadingDots label="Invocando seus dados" /> : null}

        {err ? (
          <div
            style={{
              marginTop: 14,
              border: "1px solid rgba(255,80,80,0.35)",
              padding: 12,
              borderRadius: 12,
              background: "rgba(255,80,80,0.08)",
            }}
          >
            ❌ {err}
          </div>
        ) : null}

        {!loading && payload?.ok ? (
          <>
            <div style={{ marginTop: 16 }}>
              <div style={{ opacity: 0.85, marginBottom: 10, fontWeight: 900 }}>Ações rápidas</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button onClick={() => router.push("/perfil")}>👤 Perfil</Button>
                <Button onClick={() => router.push("/resgatar")}>🎟️ Resgatar código</Button>
                <Button onClick={() => router.push("/season")}>🧭 Season Quests</Button>
                <Button onClick={() => router.push("/leaderboard")}>🏆 Leaderboard</Button>
                <Button onClick={() => router.push("/forum")}>💬 Comunidade</Button>
              </div>
            </div>

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

            <div
              style={{
                marginTop: 16,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 12,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>Status</div>
              <div style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.45 }}>
                {isLinkedDiscord ? (
                  <>
                    ✅ Discord vinculado (legado/migração):{" "}
                    <span style={{ opacity: 0.95 }}>{user.discordId}</span>
                  </>
                ) : (
                  <>ℹ️ Discord não vinculado (ok). O site funciona independente disso.</>
                )}
              </div>
            </div>
          </>
        ) : null}
      </GVQShell>
    </AuthGate>
  );
}