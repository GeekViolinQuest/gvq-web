"use client";

import AuthGate from "@/components/AuthGate";
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

function Input({ value, onChange, placeholder, type = "text", disabled }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "white",
        outline: "none",
        opacity: disabled ? 0.65 : 1,
      }}
    />
  );
}

function Button({ children, onClick, disabled, variant = "primary", title }) {
  const bg =
    variant === "danger"
      ? "rgba(255, 80, 80, 0.18)"
      : variant === "ghost"
      ? "rgba(255,255,255,0.06)"
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
        fontWeight: 900,
      }}
    >
      {children}
    </button>
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

function fmt(dt) {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
}

// Sugestão de KEY a partir das datas (ex: 2026-S1)
function suggestKey(startsAt) {
  if (!startsAt) return "";
  const d = new Date(startsAt);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const s = month <= 6 ? "S1" : "S2";
  return `${year}-${s}`;
}

// Normaliza para o padrão aceito pelo backend: [A-Z0-9._-] sem espaços
function normalizeKeyClient(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export default function AdminSeasonPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [rows, setRows] = useState([]);

  // create form
  const [key, setKey] = useState(""); // ✅ obrigatório no backend
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [createActive, setCreateActive] = useState(false);

  const canCreate = useMemo(() => {
    const k = normalizeKeyClient(key);
    if (!k) return false;

    if (!startsAt || !endsAt) return false;
    const s = new Date(startsAt);
    const e = new Date(endsAt);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
    if (!(e > s)) return false;

    // valida chars no front pra evitar ida e volta
    if (!/^[A-Z0-9._-]+$/.test(k)) return false;

    return true;
  }, [key, startsAt, endsAt]);

  async function load() {
    setLoading(true);
    setErr("");
    setMsg("");
    try {
      const r = await apiGet("/api/admin/season");
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar temporadas");
      setRows(r.data?.rows || []); // ✅ corrigido
    } catch (e) {
      setRows([]);
      setErr(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Auto-sugere KEY quando você escolhe a data (sem sobrescrever se você já digitou)
  useEffect(() => {
    if (!key.trim() && startsAt) {
      const sk = suggestKey(startsAt);
      if (sk) setKey(sk);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startsAt]);

  async function createSeason() {
    setSaving(true);
    setErr("");
    setMsg("");

    try {
      const cleanKey = normalizeKeyClient(key);

      const r = await apiFetch("/api/admin/season", {
        method: "POST",
        auth: true,
        body: {
          key: cleanKey, // ✅ obrigatório
          startsAt,
          endsAt,
          isActive: !!createActive,
        },
      });

      if (!r?.ok) throw new Error(r?.error || "Falha ao criar");

      setMsg("✅ Temporada criada!");
      setKey("");
      setStartsAt("");
      setEndsAt("");
      setCreateActive(false);
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao criar");
    } finally {
      setSaving(false);
    }
  }

  async function activate(id) {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch(`/api/admin/season/${id}/activate`, {
        method: "PATCH",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao ativar");
      setMsg("✅ Temporada ativada (as outras foram desativadas).");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao ativar");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id) {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch(`/api/admin/season/${id}/deactivate`, {
        method: "PATCH",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao desativar");
      setMsg("✅ Temporada desativada.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao desativar");
    } finally {
      setSaving(false);
    }
  }

  async function resetFirstEstelar(id) {
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch(`/api/admin/season/${id}/reset-first-estelar`, {
        method: "POST",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao resetar Primeiro Estelar");
      setMsg("✅ Primeiro Estelar resetado nesta temporada.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao resetar");
    } finally {
      setSaving(false);
    }
  }

  async function delSeason(id) {
    const ok = confirm("Deletar esta temporada? (não pode se estiver ativa)");
    if (!ok) return;

    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch(`/api/admin/season/${id}`, {
        method: "DELETE",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao deletar");
      setMsg("✅ Temporada deletada.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao deletar");
    } finally {
      setSaving(false);
    }
  }

  const active = useMemo(() => rows.find((x) => !!x.isActive) || null, [rows]);

  return (
    <AuthGate>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>Painel do Guardião Mestre — Temporadas</h1>
            <div style={{ opacity: 0.8 }}>
              CRUD mínimo: criar, listar, ativar/desativar, resetar Primeiro Estelar.
            </div>
          </div>

           <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/admin" style={{ color: "white", textDecoration: "none", opacity: 0.9 }}>
                ← Voltar ao Admin
              </Link>
            
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Pill>Total: {rows.length}</Pill>
          <Pill>Ativa: {active ? active.key : "—"}</Pill>
        </div>

        {msg ? <div style={{ marginTop: 14, color: "#9ae6b4" }}>{msg}</div> : null}
        {err ? <div style={{ marginTop: 14, color: "#feb2b2" }}>❌ {err}</div> : null}

        {/* Create */}
        <div style={{ marginTop: 18 }}>
          <Card>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>➕ Criar Temporada</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>KEY (obrigatória)</div>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="ex: 2026-S1"
                />
                <div style={{ fontSize: 11, opacity: 0.65, marginTop: 6 }}>
                  Regras: A-Z, 0-9, -, _, . (sem espaços)
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Início</div>
                <Input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="datetime-local" />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Fim</div>
                <Input value={endsAt} onChange={(e) => setEndsAt(e.target.value)} type="datetime-local" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", opacity: 0.9, fontSize: 13 }}>
                <input type="checkbox" checked={createActive} onChange={(e) => setCreateActive(e.target.checked)} />
                Criar já como ativa (desativa outras)
              </label>

              <Button onClick={createSeason} disabled={saving || !canCreate}>
                {saving ? "Salvando..." : "Criar temporada"}
              </Button>

              <Button variant="ghost" onClick={load} disabled={loading || saving}>
                🔄 Atualizar lista
              </Button>

              {!canCreate ? (
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  (Dica: key válida + fim maior que início.)
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* List */}
        <div style={{ marginTop: 18 }}>
          <Card>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>📜 Temporadas</div>

            <div style={{ overflowX: "auto" }}>
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
                    gridTemplateColumns: "220px 260px 100px 220px 1fr",
                    padding: 12,
                    opacity: 0.85,
                    background: "rgba(255,255,255,0.04)",
                    fontSize: 12,
                  }}
                >
                  <div>Key</div>
                  <div>Janela</div>
                  <div>Status</div>
                  <div>Primeiro Estelar</div>
                  <div>Ações</div>
                </div>

                {loading ? (
                  <div style={{ padding: 12, opacity: 0.8 }}>Carregando...</div>
                ) : rows?.length ? (
                  rows.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "220px 260px 100px 220px 1fr",
                        padding: 12,
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div style={{ fontSize: 13, opacity: 0.95, overflow: "hidden", textOverflow: "ellipsis" }}>
                        <div style={{ fontWeight: 900 }}>{s.key}</div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>id: {s.id}</div>
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.9 }}>
                        <div>Início: {fmt(s.startsAt)}</div>
                        <div>Fim: {fmt(s.endsAt)}</div>
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.9 }}>{s.isActive ? "✅ ativa" : "⚪ inativa"}</div>

                      <div style={{ fontSize: 12, opacity: 0.9 }}>
                        {s.firstEstelarUserId ? (
                          <>
                            <div style={{ fontWeight: 900 }}>🌟 {s.firstEstelarUserId}</div>
                            <div style={{ fontSize: 11, opacity: 0.7 }}>{fmt(s.firstEstelarAt)}</div>
                          </>
                        ) : (
                          <span style={{ opacity: 0.75 }}>—</span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {s.isActive ? (
                          <Button onClick={() => deactivate(s.id)} disabled={saving}>
                            Desativar
                          </Button>
                        ) : (
                          <Button onClick={() => activate(s.id)} disabled={saving}>
                            Ativar
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          onClick={() => resetFirstEstelar(s.id)}
                          disabled={saving}
                          title="Zera firstEstelarUserId/At"
                        >
                          Reset Estelar
                        </Button>

                        <Button
                          variant="danger"
                          onClick={() => delSeason(s.id)}
                          disabled={saving || s.isActive}
                          title={s.isActive ? "Não pode deletar temporada ativa" : "Deletar temporada"}
                        >
                          Deletar
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 12, opacity: 0.8 }}>Sem temporadas ainda.</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Regra: ativar uma temporada automaticamente desativa as demais (evita conflito).
            </div>
          </Card>
        </div>
      </div>
    </AuthGate>
  );
}