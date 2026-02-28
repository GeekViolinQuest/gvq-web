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

  // ===== Avisos do GM =====
  const [ann, setAnn] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);

  const router = useRouter();

  function AnnCard({ item }) {
    return (
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 12,
          padding: 12,
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ fontWeight: 1000 }}>{item.title}</div>
        <div style={{ marginTop: 6, opacity: 0.85, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
          {item.content}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
          {item.createdAt ? new Date(item.createdAt).toLocaleString("pt-BR") : ""}
        </div>
      </div>
    );
  }

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

    // ===== fetch avisos =====
    setAnnLoading(true);
    try {
      const a = await apiGet("/api/announcements?limit=5", { auth: true });
      if (a?.ok) setAnn(a.items || []);
      else setAnn([]);
    } catch {
      setAnn([]);
    } finally {
      setAnnLoading(false);
    }
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

  return (
    <AuthGate>
      <GVQShell
        title="Taverna do Guardião"
        subtitle={`${displayName} · ${email}`}
        right={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={load} variant="ghost" disabled={loading}>
              🔄 Atualizar
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
              <div style={{ fontWeight: 1000, marginBottom: 6 }}>Status do Guardião</div>
              <div style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.45 }}>✅ Conta ativa.</div>
            </div>

            {/* ===== Avisos do GM ===== */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 1000, marginBottom: 8 }}>📣 Avisos do GM</div>

              {annLoading ? (
                <div style={{ opacity: 0.75, fontSize: 13 }}>Carregando avisos...</div>
              ) : ann?.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {ann.map((it) => (
                    <AnnCard key={it._id || it.createdAt} item={it} />
                  ))}
                </div>
              ) : (
                <div style={{ opacity: 0.75, fontSize: 13 }}>Nenhum aviso no momento.</div>
              )}
            </div>
          </>
        ) : null}
      </GVQShell>
    </AuthGate>
  );
}