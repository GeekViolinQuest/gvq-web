"use client";

import AuthGate from "@/components/AuthGate";
import { apiGet, apiFetch } from "@/lib/api";
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
      }}
    >
      {img ? (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 10,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            flex: "0 0 auto",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
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

        {subtitle ? (
          <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>
            {subtitle}
          </div>
        ) : null}

        {locked ? (
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
            🔒 Ainda não conquistada
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [err, setErr] = useState("");

  // displayName edit
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [nameErr, setNameErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");

        const [meResp, catResp] = await Promise.all([
          apiGet("/api/user/me"),
          apiGet("/api/meta/catalog"),
        ]);

        if (!alive) return;

        if (!meResp?.ok) throw new Error(meResp?.error || "Falha ao carregar /me");
        if (!catResp?.ok) throw new Error(catResp?.error || "Falha ao carregar catálogo");

        setMe(meResp);
        setCatalog(catResp);

        // preenche input com nome atual (se tiver)
        const current = meResp?.user?.displayName || "";
        setNameInput(current);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Erro");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const progress = me?.progress || {};
  const user = me?.user || {};

  const remaining = user?.displayNameRemaining ?? 2;
  const canChangeName = remaining > 0;

  async function saveDisplayName() {
    setSavingName(true);
    setNameMsg("");
    setNameErr("");

    try {
      const resp = await apiFetch("/api/user/display-name", {
        method: "PATCH",
        auth: true,
        body: { displayName: nameInput },
      });

      if (!resp?.ok) throw new Error(resp?.error || "Falha ao salvar nome");

      // atualiza estado local do "me" pra refletir imediatamente
      setMe((prev) => {
        if (!prev) return prev;

        const prevUser = prev.user || {};
        return {
          ...prev,
          user: {
            ...prevUser,
            displayName: resp.displayName,
            displayNameChanges: resp.displayNameChanges,
            displayNameRemaining: resp.displayNameRemaining,
          },
        };
      });

      setNameMsg(resp?.message || "Nome atualizado!");
    } catch (e) {
      setNameErr(e?.message || "Erro ao salvar nome");
    } finally {
      setSavingName(false);
    }
  }

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
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <h1 style={{ fontSize: 34, marginBottom: 6 }}>Perfil</h1>
        <div style={{ opacity: 0.8, marginBottom: 16 }}>
          {user.displayName ? user.displayName : "Guardião"} · {user.email || ""}
        </div>

        {loading ? <div style={{ opacity: 0.8 }}>Carregando...</div> : null}
        {err ? (
          <div style={{ border: "1px solid rgba(255,80,80,0.35)", padding: 12, borderRadius: 12 }}>
            ❌ {err}
          </div>
        ) : null}

        {!loading && !err ? (
          <>
            {/* ======= BLOCO NICK ======= */}
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 14,
                marginBottom: 18,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 8 }}>📝 Nome do Guardião</div>
              <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 10 }}>
                Você pode definir seu nome e trocar apenas <b>uma vez</b> depois.
                <br />
                Trocas restantes: <b>{remaining}</b>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ex: Guardião Harmônico"
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    outline: "none",
                  }}
                />

                <button
                  onClick={saveDisplayName}
                  disabled={savingName || !canChangeName}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.10)",
                    color: "white",
                    cursor: savingName || !canChangeName ? "not-allowed" : "pointer",
                    opacity: savingName || !canChangeName ? 0.5 : 1,
                    fontWeight: 800,
                  }}
                  title={
                    !canChangeName
                      ? "Você já usou suas mudanças de nome."
                      : "Salvar nome"
                  }
                >
                  {savingName ? "Salvando..." : "Salvar Nome"}
                </button>
              </div>

              {nameMsg ? <div style={{ marginTop: 10, color: "#9ae6b4" }}>{nameMsg}</div> : null}
              {nameErr ? <div style={{ marginTop: 10, color: "#feb2b2" }}>❌ {nameErr}</div> : null}

              {!canChangeName ? (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                  🔒 Você atingiu o limite de mudanças. Se precisar corrigir um erro de digitação,
                  o Guardião Mestre pode ajustar manualmente no banco.
                </div>
              ) : null}
            </div>

            {/* ======= CARDS PROGRESSO ======= */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                marginBottom: 22,
              }}
            >
              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Nível</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{progress.level ?? 0}</div>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Cristais Sonoros</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{progress.cristais ?? 0}</div>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Runas</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{gotRunas}/{totalRunas}</div>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Relíquias</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{gotReliquias}/{totalReliquias}</div>
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
      </div>
    </AuthGate>
  );
}