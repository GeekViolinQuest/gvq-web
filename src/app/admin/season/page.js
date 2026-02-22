"use client";

import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function AdminSeasonPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(false);

  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const canCreate = useMemo(() => !!startsAt && !!endsAt, [startsAt, endsAt]);

  async function load() {
    setErr("");
    setMsg("");
    try {
      setLoading(true);
      const r = await apiGet("/api/admin/season/seasons");
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar temporadas");
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
  }, []);

  async function createSeason() {
    setCreating(true);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch("/api/admin/season/seasons", {
        method: "POST",
        auth: true,
        body: {
          title: title.trim() || undefined,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          isActive,
        },
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao criar");

      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setIsActive(false);

      setMsg("✅ Temporada criada.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao criar");
    } finally {
      setCreating(false);
    }
  }

  async function setActive(id, active) {
    setBusyId(id);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch(`/api/admin/season/seasons/${id}`, {
        method: "PATCH",
        auth: true,
        body: { isActive: !!active },
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao atualizar");
      setMsg(active ? "🔥 Temporada ativada (as outras foram desativadas)." : "✅ Temporada desativada.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setBusyId(null);
    }
  }

  async function resetFirstEstelar(id) {
    setBusyId(id);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch(`/api/admin/season/seasons/${id}/reset-first-estelar`, {
        method: "POST",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao resetar");
      setMsg("✅ Primeiro Estelar resetado nesta temporada.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AuthGate>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div style={{ marginBottom: 14, opacity: 0.85 }}>
          <Link href="/admin" style={{ color: "white", textDecoration: "none" }}>
            ← Voltar ao Painel
          </Link>
        </div>

        <h1 style={{ fontSize: 30, marginBottom: 6 }}>CRUD — Temporadas</h1>
        <div style={{ opacity: 0.8, marginBottom: 14 }}>
          Crie e ative a temporada do semestre. Ativar uma temporada desativa as demais.
        </div>

        {/* Create */}
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 14, background: "rgba(255,255,255,0.03)" }}>
          <div style={{ fontWeight: 1000, marginBottom: 10 }}>Criar temporada</div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (opcional)"
            style={{
              width: "100%", padding: 12, borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)", color: "white", outline: "none",
              marginBottom: 10,
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "white", outline: "none" }}
            />
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "white", outline: "none" }}
            />
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, opacity: 0.9 }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Criar já como <b>ativa</b>
          </label>

          <button
            onClick={createSeason}
            disabled={!canCreate || creating}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              cursor: "pointer",
              opacity: !canCreate || creating ? 0.6 : 1,
            }}
          >
            {creating ? "Criando..." : "Criar"}
          </button>
        </div>

        {msg ? <div style={{ marginTop: 14, color: "#9ae6b4" }}>{msg}</div> : null}
        {err ? <div style={{ marginTop: 14, color: "#feb2b2" }}>❌ {err}</div> : null}

        {/* List */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Temporadas</h2>
            <button
              onClick={load}
              style={{
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

          <div style={{ marginTop: 10, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 220px 220px 260px", padding: 12, opacity: 0.85, background: "rgba(255,255,255,0.04)", fontSize: 12 }}>
              <div>Status</div>
              <div>Título</div>
              <div>Início</div>
              <div>Fim</div>
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
                    gridTemplateColumns: "110px 1fr 220px 220px 260px",
                    padding: 12,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 1000, color: s.isActive ? "#9ae6b4" : "rgba(255,255,255,0.8)" }}>
                    {s.isActive ? "🔥 ATIVA" : "—"}
                  </div>

                  <div style={{ opacity: 0.95 }}>{s.title || "(sem título)"}</div>

                  <div style={{ opacity: 0.85 }}>{s.startsAt ? new Date(s.startsAt).toLocaleString("pt-BR") : "—"}</div>
                  <div style={{ opacity: 0.85 }}>{s.endsAt ? new Date(s.endsAt).toLocaleString("pt-BR") : "—"}</div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setActive(s.id, true)}
                      disabled={busyId === s.id || s.isActive}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.08)",
                        color: "white",
                        cursor: "pointer",
                        opacity: busyId === s.id || s.isActive ? 0.5 : 1,
                      }}
                    >
                      Ativar
                    </button>

                    <button
                      onClick={() => setActive(s.id, false)}
                      disabled={busyId === s.id || !s.isActive}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.05)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.12)",
                        cursor: "pointer",
                        opacity: busyId === s.id || !s.isActive ? 0.5 : 1,
                      }}
                    >
                      Desativar
                    </button>

                    <button
                      onClick={() => resetFirstEstelar(s.id)}
                      disabled={busyId === s.id}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.03)",
                        color: "white",
                        cursor: "pointer",
                        opacity: busyId === s.id ? 0.5 : 1,
                      }}
                      title="Zera a marcação de Primeiro Estelar dessa temporada"
                    >
                      Reset 1º Estelar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: 12, opacity: 0.8 }}>Sem temporadas.</div>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}