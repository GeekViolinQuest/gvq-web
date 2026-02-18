"use client";

import AuthGate from "@/components/AuthGate";
import { apiGet } from "@/lib/api";
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
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : null}
      </div>

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
        {subtitle ? <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>{subtitle}</div> : null}
        {locked ? <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>🔒 Ainda não conquistada</div> : null}
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [err, setErr] = useState("");

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
        <div style={{ opacity: 0.8, marginBottom: 22 }}>
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
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {gotRunas}/{totalRunas}
                </div>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 14 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Relíquias</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {gotReliquias}/{totalReliquias}
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: 20, margin: "22px 0 10px" }}>Runas</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
              {runasList.map((r) => (
                <ItemCard
                  key={`runa-${r.code}`}
                  title={r.nome}
                  subtitle={`Código: ${r.code}`}
                  img={r.imagem}
                  locked={r.locked}
                  tag={r.tipo ? `Runa ${r.tipo}` : ""}
                />
              ))}
            </div>

            <h2 style={{ fontSize: 20, margin: "28px 0 10px" }}>Relíquias</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
              {reliquiasList.map((r) => (
                <ItemCard
                  key={`rel-${r.code}`}
                  title={r.nome}
                  subtitle={`Código: ${r.code}`}
                  img={r.imagem}
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
