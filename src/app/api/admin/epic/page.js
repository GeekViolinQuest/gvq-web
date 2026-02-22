"use client";

import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

function Pill({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        opacity: 0.9,
      }}
    >
      {children}
    </span>
  );
}

function toLocalInputValue(d) {
  // datetime-local espera "YYYY-MM-DDTHH:mm"
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const mm = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mi = pad(dt.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AdminEpicPage() {
  const [me, setMe] = useState(null);

  const [rows, setRows] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [creating, setCreating] = useState(false);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [createActive, setCreateActive] = useState(false);

  const [busyId, setBusyId] = useState(null);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const canCreate = useMemo(() => {
    return slug.trim().length >= 2 && title.trim().length >= 2 && !!startsAt && !!endsAt;
  }, [slug, title, startsAt, endsAt]);

  async function loadMe(signal) {
    const r = await apiGet("/api/admin/epic/me", { signal });
    if (!r?.ok) throw new Error(r?.error || "Falha ao carregar permissões");
    setMe(r.acesso || null);
  }

  async function loadList(signal) {
    try {
      setLoadingList(true);
      const r = await apiGet("/api/admin/epic/events", { signal });
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar eventos");
      setRows(r.rows || []);
    } finally {
      setLoadingList(false);
    }
  }

  async function loadAll(signal) {
    setErr("");
    setMsg("");
    try {
      await loadMe(signal);
      await loadList(signal);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setErr(e?.message || "Erro ao carregar");
      setRows([]);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    loadAll(ac.signal);
    return () => ac.abort();
  }, []);

  async function refresh() {
    const ac = new AbortController();
    await loadAll(ac.signal);
  }

  async function createEvent() {
    setCreating(true);
    setErr("");
    setMsg("");

    try {
      const payload = {
        slug: slug.trim(),
        title: title.trim(),
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        isActive: !!createActive,
      };

      const r = await apiFetch("/api/admin/epic/events", {
        method: "POST",
        auth: true,
        body: payload,
      });

      if (!r?.ok) throw new Error(r?.error || "Falha ao criar evento");

      setMsg(`✅ Evento criado: ${r?.event?.title || payload.title}`);
      setSlug("");
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setCreateActive(false);

      await loadList();
    } catch (e) {
      setErr(e?.message || "Erro ao criar");
    } finally {
      setCreating(false);
    }
  }

  async function activate(id) {
    setBusyId(id);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch(`/api/admin/epic/events/${id}/activate`, {
        method: "PATCH",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao ativar");
      setMsg("🔥 Evento ativado (os demais foram desativados).");
      await loadList();
    } catch (e) {
      setErr(e?.message || "Erro ao ativar");
    } finally {
      setBusyId(null);
    }
  }

  async function deactivate(id) {
    setBusyId(id);
    setErr("");
    setMsg("");
    try {
      const r = await apiFetch(`/api/admin/epic/events/${id}/deactivate`, {
        method: "PATCH",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao desativar");
      setMsg("✅ Evento desativado.");
      await loadList();
    } catch (e) {
      setErr(e?.message || "Erro ao desativar");
    } finally {
      setBusyId(null);
    }
  }

  const isGM = (me?.role || "aluno") === "gm" && (me?.status || "ativo") === "ativo";

  return (
    <AuthGate>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>Admin — Eventos Épicos</h1>
            <div style={{ opacity: 0.8 }}>
              Criar / ativar / desativar EpicEvent (apenas GM).
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.9 }}>
              <Pill>Status: {me?.status || "—"}</Pill>
              <Pill>Role: {me?.role || "—"}</Pill>
              {isGM ? <Pill>✅ Acesso liberado</Pill> : <Pill>⛔ Sem permissão</Pill>}
            </div>
          </div>

          <button
            onClick={refresh}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
              height: 42,
              alignSelf: "flex-start",
            }}
          >
            🔄 Atualizar
          </button>
        </div>

        {err ? (
          <div style={{ marginTop: 14, color: "#feb2b2" }}>❌ {err}</div>
        ) : null}
        {msg ? (
          <div style={{ marginTop: 14, color: "#9ae6b4" }}>{msg}</div>
        ) : null}

        {/* Create */}
        <div
          style={{
            marginTop: 18,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
            opacity: isGM ? 1 : 0.5,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Criar novo evento</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug (ex: epico-staccato-fev)"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "white",
                outline: "none",
              }}
              disabled={!isGM || creating}
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título (ex: Quest Épica — Staccato Supremo)"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "white",
                outline: "none",
              }}
              disabled={!isGM || creating}
            />

            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "white",
                outline: "none",
              }}
              disabled={!isGM || creating}
            />
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                color: "white",
                outline: "none",
              }}
              disabled={!isGM || creating}
            />
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, opacity: 0.9 }}>
            <input
              type="checkbox"
              checked={createActive}
              onChange={(e) => setCreateActive(e.target.checked)}
              disabled={!isGM || creating}
            />
            Criar já como <b>ativo</b> (desativa os demais automaticamente)
          </label>

          <button
            onClick={createEvent}
            disabled={!isGM || creating || !canCreate}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.10)",
              color: "white",
              cursor: "pointer",
              opacity: !isGM || creating || !canCreate ? 0.6 : 1,
            }}
          >
            {creating ? "Criando..." : "Criar evento"}
          </button>

          <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
            Dica: use datas em horário local. O backend grava em ISO/UTC.
          </div>
        </div>

        {/* List */}
        <div style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Eventos</h2>

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
                gridTemplateColumns: "120px 1.2fr 1.8fr 200px 200px 160px",
                gap: 10,
                padding: 12,
                opacity: 0.85,
                background: "rgba(255,255,255,0.04)",
                fontSize: 12,
              }}
            >
              <div>Status</div>
              <div>Slug</div>
              <div>Título</div>
              <div>Início</div>
              <div>Fim</div>
              <div>Ações</div>
            </div>

            {loadingList ? (
              <div style={{ padding: 12, opacity: 0.8 }}>Carregando...</div>
            ) : rows?.length ? (
              rows.map((e) => {
                const activeLabel = e.isActive ? "🔥 ATIVO" : "—";
                const statusColor = e.isActive ? "#9ae6b4" : "rgba(255,255,255,0.75)";

                return (
                  <div
                    key={e.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1.2fr 1.8fr 200px 200px 160px",
                      gap: 10,
                      padding: 12,
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      alignItems: "center",
                      fontSize: 13,
                    }}
                  >
                    <div style={{ fontWeight: 900, color: statusColor }}>{activeLabel}</div>
                    <div style={{ opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis" }}>{e.slug}</div>
                    <div style={{ opacity: 0.95, overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                    <div style={{ opacity: 0.85 }}>
                      {e.startsAt ? new Date(e.startsAt).toLocaleString("pt-BR") : "—"}
                    </div>
                    <div style={{ opacity: 0.85 }}>
                      {e.endsAt ? new Date(e.endsAt).toLocaleString("pt-BR") : "—"}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => activate(e.id)}
                        disabled={!isGM || busyId === e.id || e.isActive}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.08)",
                          color: "white",
                          cursor: "pointer",
                          opacity: !isGM || busyId === e.id || e.isActive ? 0.5 : 1,
                        }}
                        title={e.isActive ? "Já está ativo" : "Ativar (desativa os outros)"}
                      >
                        Ativar
                      </button>

                      <button
                        onClick={() => deactivate(e.id)}
                        disabled={!isGM || busyId === e.id || !e.isActive}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.05)",
                          color: "white",
                          cursor: "pointer",
                          opacity: !isGM || busyId === e.id || !e.isActive ? 0.5 : 1,
                        }}
                        title={!e.isActive ? "Já está desativado" : "Desativar"}
                      >
                        Desativar
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: 12, opacity: 0.8 }}>Sem eventos ainda.</div>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}