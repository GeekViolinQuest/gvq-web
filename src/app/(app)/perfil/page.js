"use client";

import AuthGate from "@/components/AuthGate";
import GVQShell from "@/components/GVQShell";
import LoadingDots from "@/components/LoadingDots";
import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

function ItemCard({ title, subtitle, img, locked, tag }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        gap: 12,
        alignItems: "center",
        opacity: locked ? 0.35 : 1,
        background: "rgba(255,255,255,0.03)",
      
      }}
    >
      <div
        style={{
          width: 128,
          height: 128,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.04)",
          flex: "0 0 auto",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img || "/locked.png"}
          alt={title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/locked.png";
        }}
        />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>{title}</div>
          {tag ? (
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                opacity: 0.9,
              }}
            >
              {tag}
            </span>
          ) : null}
        </div>

        {subtitle ? <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>{subtitle}</div> : null}

        {locked ? <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>🔒 Ainda não conquistada</div> : null}
      </div>
    </div>
  );
}

function Button({ onClick, children, disabled, variant = "solid", title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: variant === "solid" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        fontWeight: 900,
      }}
    >
      {children}
    </button>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      style={{
        flex: 1,
        minWidth: 220,
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "white",
        outline: "none",
        ...props.style,
      }}
    />
  );
}

/**
 * NickEditor (site-first)
 * - chama POST /api/user/display-name
 * - recarrega /me via onUpdated
 * - usa displayNameRemaining do /me para bloquear mudanças
 */
function NickEditor({ user, onUpdated }) {
  const currentName = user?.displayName || "";
  const remaining = user?.displayNameRemaining ?? 1;
  const canChange = !currentName || remaining > 0;

  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(currentName || "");
  }, [currentName]);

  async function save() {
    setSaving(true);
    setMsg("");
    setErr("");

    const r = await apiPost("/api/user/display-name", { displayName: name }, { auth: true });

    setSaving(false);

    if (!r.ok) return setErr(r.error || "Falha ao salvar");

    setMsg(r.data?.message || "✅ Nick atualizado!");
    await onUpdated?.();
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontWeight: 1000, marginBottom: 8 }}>📝 Nome do Guardião</div>

      <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 10 }}>
        {!currentName ? (
          <>
            Defina seu nome pela primeira vez (grátis). Depois você terá <b>apenas 1 troca</b>.
          </>
        ) : (
          <>
            Você pode trocar apenas <b>uma vez</b> depois. Trocas restantes: <b>{remaining}</b>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Guardião Harmônico"
          disabled={!canChange || saving}
          style={{ opacity: canChange ? 1 : 0.55 }}
        />

        <Button
          onClick={save}
          disabled={saving || !canChange}
          title={!canChange ? "Você já usou sua troca de Nick." : "Salvar Nick"}
        >
          {saving ? "Salvando..." : "Salvar Nick"}
        </Button>
      </div>

      {msg ? <div style={{ marginTop: 10, opacity: 0.95 }}>✅ {msg}</div> : null}
      {err ? <div style={{ marginTop: 10, color: "#feb2b2" }}>❌ {err}</div> : null}

      {!canChange ? (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
          🔒 Você atingiu o limite de mudanças. Se precisar corrigir um erro, o Guardião Mestre pode ajustar manualmente no banco.
        </div>
      ) : null}
    </div>
  );
}

/**
 * AvatarEditor
 * - salva em Aluno.avatarUrl via POST /api/user/avatar
 * - aceita URL https ou arquivo pequeno (dataURL)
 */
function AvatarEditor({ user, onUpdated }) {
  const current = user?.avatarUrl || "";
  const [preview, setPreview] = useState(current);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    setPreview(current || "");
  }, [current]);

  async function saveAvatar(avatarUrl) {
    setSaving(true);
    setMsg("");
    setErr("");

    const r = await apiPost("/api/user/avatar", { avatarUrl }, { auth: true });

    setSaving(false);

    if (!r.ok) return setErr(r.error || "Falha ao salvar avatar");

    setMsg("Avatar atualizado!");
    await onUpdated?.();
  }

  async function pickFile(file) {
    if (!file) return;

    // limite recomendado (tanto pra UI quanto pro backend)
    const MAX = 120 * 1024; // 120 KB
    if (file.size > MAX) {
      setErr("Arquivo muito grande. Use no máximo 120KB (ou envie uma URL).");
      return;
    }

    setErr("");
    setMsg("");

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      setPreview(dataUrl);
      await saveAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontWeight: 1000, marginBottom: 8 }}>🧑‍🎨 Avatar</div>
      <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 10 }}>
        Você pode usar uma URL (https) ou enviar um arquivo pequeno (até 120KB).  
        O avatar é salvo no seu progresso (Aluno.avatarUrl).
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview || "/avatar-placeholder.png"}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/avatar-placeholder.png";
            }}    
          />
        </div>

        <div style={{ flex: 1, minWidth: 260, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://... (opcional)"
              disabled={saving}
            />
            <Button onClick={() => saveAvatar(url)} disabled={saving || !url.trim()}>
              Salvar URL
            </Button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <label
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.55 : 1,
                fontWeight: 900,
              }}
            >
              Enviar arquivo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                style={{ display: "none" }}
                disabled={saving}
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>

            <Button variant="ghost" onClick={() => saveAvatar("")} disabled={saving}>
              Remover
            </Button>
          </div>
        </div>
      </div>

      {msg ? <div style={{ marginTop: 10, opacity: 0.95 }}>✅ {msg}</div> : null}
      {err ? <div style={{ marginTop: 10, color: "#feb2b2" }}>❌ {err}</div> : null}
    </div>
  );
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [err, setErr] = useState("");

  async function reloadMeOnly() {
    const r = await apiGet("/api/user/me", { auth: true });
    if (r.ok) setMe(r.data);
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      const [meR, catR] = await Promise.all([
        apiGet("/api/user/me", { auth: true }),
        apiGet("/api/meta/catalog", { auth: true }),
      ]);

      if (!alive) return;

      if (!meR.ok) {
        setErr(meR.error || "Falha ao carregar /me");
        setLoading(false);
        return;
      }

      if (!catR.ok) {
        setErr(catR.error || "Falha ao carregar catálogo");
        setLoading(false);
        return;
      }

      setMe(meR.data);
      setCatalog(catR.data);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const progress = me?.progress || {};
  const user = me?.user || {};

  const unlockedRunas = new Set(progress.runas || []);
  const unlockedReliquias = new Set(progress.reliquias || []);

  const runasList = useMemo(() => {
    const obj = catalog?.runas || {};
    return Object.entries(obj).map(([code, data]) => ({
      code,
      nome: data?.nome || code,
      imagem: data?.imagem || null,
      tipo: data?.tipo || "",
      locked: !unlockedRunas.has(code),
    }));
  }, [catalog, unlockedRunas]);

  const reliquiasList = useMemo(() => {
    const obj = catalog?.reliquias || {};
    return Object.entries(obj).map(([code, data]) => ({
      code,
      nome: data?.nome || code,
      imagem: data?.imagem || null,
      locked: !unlockedReliquias.has(code),
    }));
  }, [catalog, unlockedReliquias]);

  const totalRunas = runasList.length;
  const totalReliquias = reliquiasList.length;

  const gotRunas = runasList.filter((x) => !x.locked).length;
  const gotReliquias = reliquiasList.filter((x) => !x.locked).length;

  return (
    <AuthGate>
      <GVQShell
        title="Perfil"
        subtitle={`${user.displayName ? user.displayName : "Guardião"} · ${user.email || ""}`}
      >
        {loading ? <LoadingDots label="Ajustando as runas do perfil" /> : null}

        {err ? (
          <div style={{ border: "1px solid rgba(255,80,80,0.35)", padding: 12, borderRadius: 12 }}>
            ❌ {err}
          </div>
        ) : null}

        {!loading && !err ? (
          <>
            <AvatarEditor user={user} onUpdated={reloadMeOnly} />
            <NickEditor user={user} onUpdated={reloadMeOnly} />

            {/* ======= CARDS PROGRESSO ======= */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                gap: 12,
                marginBottom: 22,
              }}
            >
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Nível</div>
                <div style={{ fontSize: 26, fontWeight: 1000 }}>{progress.level ?? 0}</div>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Cristais Sonoros</div>
                <div style={{ fontSize: 26, fontWeight: 1000 }}>{progress.cristais ?? 0}</div>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Runas</div>
                <div style={{ fontSize: 18, fontWeight: 1000 }}>
                  {gotRunas}/{totalRunas}
                </div>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Relíquias</div>
                <div style={{ fontSize: 18, fontWeight: 1000 }}>
                  {gotReliquias}/{totalReliquias}
                </div>
              </div>
            </div>

            {/* ======= RUNAS ======= */}
            <h2 style={{ fontSize: 20, margin: "22px 0 10px" }}>Runas</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
              {runasList.map((r) => (
                <ItemCard
                  key={`runa-${r.code}`}
                  title={r.locked ? "Runa desconhecida" : r.nome}
                  subtitle={r.locked ? "" : `Código: ${r.code}`}
                  img={r.locked ? "/locked.png" : r.imagem}
                  locked={r.locked}
                  tag={r.locked ? "" : r.tipo ? `Runa ${r.tipo}` : ""}
                />
              ))}
            </div>

            {/* ======= RELÍQUIAS ======= */}
            <h2 style={{ fontSize: 20, margin: "28px 0 10px" }}>Relíquias</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
              {reliquiasList.map((r) => (
                <ItemCard
                  key={`rel-${r.code}`}
                  title={r.locked ? "Relíquia desconhecida" : r.nome}
                  subtitle={r.locked ? "" : `Código: ${r.code}`}
                  img={r.locked ? "/locked.png" : r.imagem}
                  locked={r.locked}
                />
              ))}
            </div>
          </>
        ) : null}
      </GVQShell>
    </AuthGate>
  );
}