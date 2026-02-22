"use client";

import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>{label}</div>
      {children}
    </div>
  );
}

function btnStyle(kind = "normal", disabled = false) {
  const base = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
  };

  if (kind === "primary") return { ...base, background: "rgba(255,255,255,0.12)" };
  if (kind === "danger") return { ...base, background: "rgba(255,80,80,0.18)" };
  return { ...base, background: "rgba(255,255,255,0.06)" };
}

function inputStyle() {
  return {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "white",
    outline: "none",
  };
}

function toLocalDatetimeInputValue(d) {
  // datetime-local usa "YYYY-MM-DDTHH:mm"
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const mm = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mi = pad(dt.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AdminEpicPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [rows, setRows] = useState([]);

  // create form
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(false);

  const canCreate = useMemo(() => {
    return slug.trim().length >= 2 && title.trim().length >= 2 && !!startsAt && !!endsAt;
  }, [slug, title, startsAt, endsAt]);

  async function load() {
    try {
      setErr("");
      setMsg("");
      setLoading(true);

      const r = await apiGet("/api/admin/epic/events?limit=200", { auth: true });
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar eventos");
      setRows(r.rows || []);
    } catch (e) {
      setErr(e?.message || "Erro");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createEvent() {
    if (!canCreate) return;
    try {
      setSaving(true);
      setErr("");
      setMsg("");

      const r = await apiFetch("/api/admin/epic/events", {
        method: "POST",
        auth: true,
        body: {
          slug: slug.trim(),
          title: title.trim(),
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          isActive,
        },
      });

      if (!r?.ok) throw new Error(r?.error || "Falha ao criar");

      setMsg("✅ Evento criado.");
      setSlug("");
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setIsActive(false);

      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao criar");
    } finally {
      setSaving(false);
    }
  }

  async function activate(id) {
    try {
      setSaving(true);
      setErr("");
      setMsg("");

      const r = await apiFetch(`/api/admin/epic/events/${id}/activate`, {
        method: "PATCH",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao ativar");
      setMsg("🔥 Evento ativado (os outros foram desativados).");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao ativar");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id) {
    try {
      setSaving(true);
      setErr("");
      setMsg("");

      const r = await apiFetch(`/api/admin/epic/events/${id}/deactivate`, {
        method: "PATCH",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao desativar");
      setMsg("🧊 Evento desativado.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao desativar");
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(id) {
    const ok = window.confirm("Tem certeza que deseja deletar este evento? (não pode estar ativo)");
    if (!ok) return;

    try {
      setSaving(true);
      setErr("");
      setMsg("");

      const r = await apiFetch(`/api/admin/epic/events/${id}`, {
        method: "DELETE",
        auth: true,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao deletar");
      setMsg("🗑️ Evento deletado.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao deletar");
    } finally {
      setSaving(false);
    }
  }

  async function quickPatch(id, patch) {
    try {
      setSaving(true);
      setErr("");
      setMsg("");

      const r = await apiFetch(`/api/admin/epic/events/${id}`, {
        method: "PATCH",
        auth: true,
        body: patch,
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao salvar alterações");
      setMsg("✅ Alterações salvas.");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGate>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 30, marginBottom: 6 }}>Admin • Epic Events</h1>
            <div style={{ opacity: 0.8 }}>Criar/ativar/desativar eventos épicos. Apenas GM ativo.</div>
          </div>

          <button onClick={load} style={btnStyle("normal", loading || saving)} disabled={loading || saving}>
            🔄 Atualizar
          </button>
        </div>

        {err ? (
          <div style={{ border: "1px solid rgba(255,80,80,0.35)", padding: 12, borderRadius: 12, marginTop: 14 }}>
            ❌ {err}
          </div>
        ) : null}

        {msg ? <div style={{ marginTop: 14, color: "#9ae6b4" }}>{msg}</div> : null}

        {/* Create */}
        <div
          style={{
            marginTop: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14,
            background: "rgba(255,255,255,0.03)",
            opacity: saving ? 0.95 : 1,
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Criar novo EpicEvent</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <Field label="Slug (ex: epico-fev-01)">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} style={inputStyle()} />
            </Field>

            <Field label="Título (aparece no site)">
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle()} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <Field label="Início (America/Sao_Paulo — você escolhe aqui)">
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputStyle()} />
            </Field>

            <Field label="Fim">
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={inputStyle()} />
            </Field>
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10, opacity: 0.9 }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Criar já como ativo (desativa os outros)
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button onClick={createEvent} disabled={!canCreate || saving} style={btnStyle("primary", !canCreate || saving)}>
              {saving ? "Salvando..." : "Criar evento"}
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 1000, marginBottom: 8 }}>Eventos</div>
          {loading ? <div style={{ opacity: 0.8 }}>Carregando...</div> : null}

          <div style={{ display: "grid", gap: 12 }}>
            {(rows || []).map((e) => (
              <div
                key={e.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 14,
                  background: "rgba(255,255,255,0.03)",
                  opacity: saving ? 0.9 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 1000 }}>
                      {e.isActive ? "🔥 " : ""}
                      {e.title}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                      slug: <b>{e.slug}</b>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                      Início: {e.startsAt ? new Date(e.startsAt).toLocaleString("pt-BR") : "—"} • Fim:{" "}
                      {e.endsAt ? new Date(e.endsAt).toLocaleString("pt-BR") : "—"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {e.isActive ? (
                      <button onClick={() => deactivate(e.id)} disabled={saving} style={btnStyle("normal", saving)}>
                        Desativar
                      </button>
                    ) : (
                      <button onClick={() => activate(e.id)} disabled={saving} style={btnStyle("primary", saving)}>
                        Ativar
                      </button>
                    )}

                    <button onClick={() => removeEvent(e.id)} disabled={saving} style={btnStyle("danger", saving)}>
                      Deletar
                    </button>
                  </div>
                </div>

                {/* Quick edit */}
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                  <Field label="Editar slug">
                    <input
                      defaultValue={e.slug}
                      onBlur={(ev) => {
                        const v = ev.target.value.trim();
                        if (!v || v === e.slug) return;
                        quickPatch(e.id, { slug: v });
                      }}
                      style={inputStyle()}
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Editar título">
                    <input
                      defaultValue={e.title}
                      onBlur={(ev) => {
                        const v = ev.target.value.trim();
                        if (!v || v === e.title) return;
                        quickPatch(e.id, { title: v });
                      }}
                      style={inputStyle()}
                      disabled={saving}
                    />
                  </Field>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Field label="Editar início">
                    <input
                      type="datetime-local"
                      defaultValue={toLocalDatetimeInputValue(e.startsAt)}
                      onBlur={(ev) => {
                        const v = ev.target.value;
                        if (!v) return;
                        const iso = new Date(v).toISOString();
                        const curIso = e.startsAt ? new Date(e.startsAt).toISOString() : "";
                        if (iso === curIso) return;
                        quickPatch(e.id, { startsAt: iso });
                      }}
                      style={inputStyle()}
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Editar fim">
                    <input
                      type="datetime-local"
                      defaultValue={toLocalDatetimeInputValue(e.endsAt)}
                      onBlur={(ev) => {
                        const v = ev.target.value;
                        if (!v) return;
                        const iso = new Date(v).toISOString();
                        const curIso = e.endsAt ? new Date(e.endsAt).toISOString() : "";
                        if (iso === curIso) return;
                        quickPatch(e.id, { endsAt: iso });
                      }}
                      style={inputStyle()}
                      disabled={saving}
                    />
                  </Field>
                </div>

                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                  Dica: as edições salvam no <b>onBlur</b> (quando você sai do campo).
                </div>
              </div>
            ))}

            {!loading && (!rows || rows.length === 0) ? <div style={{ opacity: 0.8 }}>Nenhum evento ainda.</div> : null}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}