"use client";

import AuthGate from "@/components/AuthGate";
import { apiGet } from "@/lib/api";
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

function Button({ children, onClick, disabled, variant = "primary", title }) {
  const bg = variant === "ghost" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.10)";
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

export default function AdminAlunosPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const qs = new URLSearchParams();
      if (q.trim()) qs.set("q", q.trim());
      qs.set("limit", "120");

      const r = await apiGet(`/api/admin/alunos/alunos?${qs.toString()}`);
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar alunos");

      setRows(r.rows || []);
    } catch (e) {
      setRows([]);
      setErr(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const total = rows.length;
    const ativos = rows.filter((x) => (x.status || "ativo") === "ativo").length;
    const bloqueados = rows.filter((x) => x.status === "bloqueado").length;
    const lendarios = rows.filter((x) => !!x.isLendario).length;
    return { total, ativos, bloqueados, lendarios };
  }, [rows]);

  return (
    <AuthGate>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>Painel do Guardião Mestre — Alunos</h1>
            <div style={{ opacity: 0.8 }}>Busca e visão rápida do progresso (site-first).</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/admin/tools" style={{ color: "white", textDecoration: "none", opacity: 0.9 }}>
              💎 Tools
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Pill>Total: {totals.total}</Pill>
          <Pill>Ativos: {totals.ativos}</Pill>
          <Pill>Bloqueados: {totals.bloqueados}</Pill>
          <Pill>Lendários: {totals.lendarios}</Pill>
        </div>

        <Card>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por email, displayName, nome real..."
              />
            </div>

            <Button onClick={load} disabled={loading}>
              {loading ? "Carregando..." : "🔎 Buscar / Atualizar"}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setQ("");
                // força reload sem query
                setTimeout(load, 0);
              }}
              disabled={loading}
              title="Limpa a busca e recarrega"
            >
              Limpar
            </Button>
          </div>

          {err ? (
            <div style={{ marginTop: 12, color: "#feb2b2" }}>❌ {err}</div>
          ) : null}

          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <div
              style={{
                minWidth: 980,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {/* header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "280px 220px 100px 120px 120px 100px 1fr",
                  padding: 12,
                  opacity: 0.85,
                  background: "rgba(255,255,255,0.04)",
                  fontSize: 12,
                }}
              >
                <div>Email</div>
                <div>Nome</div>
                <div>Status</div>
                <div>Role</div>
                <div>Progresso</div>
                <div>💎 Cristais</div>
                <div>Ações</div>
              </div>

              {/* rows */}
              {loading ? (
                <div style={{ padding: 12, opacity: 0.8 }}>Carregando...</div>
              ) : rows?.length ? (
                rows.map((r) => (
                  <div
                    key={`${r.email}-${r.userId || "noid"}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "280px 220px 100px 120px 120px 100px 1fr",
                      padding: 12,
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontSize: 13, opacity: 0.95, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.email}
                      {r.isLendario ? <span style={{ marginLeft: 8, opacity: 0.9 }}>✨</span> : null}
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.95, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.nome || "—"}
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      {r.status === "bloqueado" ? "🚫 bloqueado" : "✅ ativo"}
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      {r.role === "gm" ? "👑 gm" : "aluno"}
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.9 }}>
                      Lv {r.level ?? 0} • 🏆 {r.reliquiasCount ?? 0} • ᚱ {r.runasCount ?? 0}
                    </div>

                    <div style={{ fontWeight: 900 }}>{r.cristais ?? 0}</div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Link
                        href={`/admin/tools?userId=${encodeURIComponent(r.userId || "")}&email=${encodeURIComponent(r.email || "")}`}
                        style={{
                          color: "white",
                          textDecoration: "none",
                          border: "1px solid rgba(255,255,255,0.12)",
                          padding: "8px 10px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.06)",
                          fontSize: 12,
                          opacity: 0.95,
                        }}
                        title="Abrir Tools já com userId/email preenchidos"
                      >
                        💎 Ajustar
                      </Link>

                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        {r.userId ? (
                          <span title={r.userId}>userId ok</span>
                        ) : (
                          <span title="Não achou User pelo email">sem userId</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 12, opacity: 0.8 }}>Sem resultados.</div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
            Observação: se um aluno tiver Acesso mas ainda não existir documento em <b>Aluno</b>, ele aparece com cristais/level = 0 (upsert acontece quando ele usa o site/quests).
          </div>
        </Card>
      </div>
    </AuthGate>
  );
}