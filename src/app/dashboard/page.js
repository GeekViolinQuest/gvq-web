"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGate from "@/components/AuthGate";
import { apiFetch, clearToken } from "@/lib/api";
import { GVQ } from "@/lib/theme";
import { GVQButton, GVQAlert, Row } from "@/components/ui/GVQ";

function StatCard({ label, value }) {
  return (
    <div
      style={{
        border: `1px solid ${GVQ.colors.border2}`,
        borderRadius: GVQ.radius.md,
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
  const router = useRouter();

  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);

    const r = await apiFetch("/api/user/me");

    if (!r.ok && (r.status === 401 || r.status === 403)) {
      clearToken();
      router.replace("/login");
      return;
    }

    if (!r.ok) {
      setPayload(null);
      setErr(r.data?.error || `Falha ao carregar /me (HTTP ${r.status})`);
      setLoading(false);
      return;
    }

    setPayload(r.data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  const ok = !!payload?.ok;
  const user = payload?.user || {};
  const progress = payload?.progress || {};

  const displayName = user?.displayName || "Guardião";
  const email = user?.email || "";
  const isLinkedDiscord = !!user?.discordId;

  return (
    <AuthGate>
      <div
        style={{
          minHeight: "100vh",
          padding: "26px 16px",
          color: "white",
          background:
            "radial-gradient(1200px 700px at 20% 10%, rgba(120,90,255,0.14), transparent 60%), radial-gradient(900px 600px at 80% 20%, rgba(0,255,220,0.08), transparent 60%), linear-gradient(180deg, rgba(10,12,18,1) 0%, rgba(7,8,12,1) 100%)",
        }}
      >
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <Row style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ fontSize: 34, marginBottom: 6 }}>Dashboard</h1>
              <div style={{ opacity: 0.8 }}>
                {displayName} · {email}
              </div>
            </div>

            <Row>
              <GVQButton variant="ghost" onClick={load} disabled={loading}>
                🔄 Atualizar
              </GVQButton>
              <GVQButton variant="ghost" onClick={handleLogout}>
                Sair
              </GVQButton>
            </Row>
          </Row>

          {loading ? <div style={{ marginTop: 14, opacity: 0.8 }}>Carregando...</div> : null}

          {err ? <GVQAlert type="error">❌ {err}</GVQAlert> : null}

          {!loading && ok ? (
            <>
              <div style={{ marginTop: 16 }}>
                <div style={{ opacity: 0.8, marginBottom: 10 }}>Ações rápidas</div>
                <Row>
                  <GVQButton variant="ghost" onClick={() => router.push("/perfil")}>
                    👤 Perfil
                  </GVQButton>
                  <GVQButton variant="ghost" onClick={() => router.push("/resgatar")}>
                    🎟️ Resgatar código
                  </GVQButton>
                  <GVQButton variant="ghost" onClick={() => router.push("/season")}>
                    🧭 Season Quests
                  </GVQButton>
                  <GVQButton variant="ghost" onClick={() => router.push("/leaderboard")}>
                    🏆 Leaderboard
                  </GVQButton>
                  <GVQButton variant="ghost" onClick={() => router.push("/forum")}>
                    💬 Comunidade
                  </GVQButton>
                </Row>
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
                  border: `1px solid ${GVQ.colors.border2}`,
                  borderRadius: GVQ.radius.md,
                  padding: 12,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Status</div>
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

          {!loading && !ok ? (
            <div style={{ marginTop: 14, opacity: 0.85 }}>
              Não foi possível carregar os dados do dashboard.
            </div>
          ) : null}
        </div>
      </div>
    </AuthGate>
  );
}