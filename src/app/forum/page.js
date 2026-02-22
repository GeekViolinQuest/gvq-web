"use client";

import AuthGate from "@/components/AuthGate";
import { apiFetch, apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function Tag({ text }) {
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
      {text}
    </span>
  );
}

function TopicCard({ t }) {
  const when = t?.lastReplyAt
    ? new Date(t.lastReplyAt).toLocaleString("pt-BR")
    : t?.createdAt
    ? new Date(t.createdAt).toLocaleString("pt-BR")
    : "";

  const metaLabel = t?.lastReplyAt ? "Última resposta" : "Criado em";

  return (
    <Link
      href={`/forum/${t.id}`}
      style={{
        textDecoration: "none",
        color: "white",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: 14,
          background: "rgba(255,255,255,0.03)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {t.isPinned ? (
            <span style={{ fontSize: 12, opacity: 0.9 }}>📌 Fixado</span>
          ) : null}
          {t.isLocked ? (
            <span style={{ fontSize: 12, opacity: 0.9 }}>🔒 Bloqueado</span>
          ) : null}
          <div style={{ fontWeight: 900, fontSize: 16 }}>{t.title}</div>
        </div>

        {t.bodyPreview ? (
          <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.4 }}>
            {t.bodyPreview}
            {t.bodyPreview.length >= 210 ? "…" : ""}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(t.tags || []).slice(0, 6).map((x) => (
              <Tag key={`${t.id}-tag-${x}`} text={x} />
            ))}
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, display: "flex", gap: 10 }}>
            <span>💬 {t.repliesCount ?? 0}</span>
            <span>
              {metaLabel}: {when}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ForumPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // criar tópico
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState(""); // "tag1, tag2"

  const canSubmit = useMemo(() => {
    const t = title.trim();
    const b = body.trim();
    return t.length >= 3 && b.length >= 3;
  }, [title, body]);

  async function loadFirst() {
    try {
      setErr("");
      setLoading(true);
      const r = await apiGet("/api/forum/topics?limit=20");
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar tópicos");

      setRows(r.rows || []);
      setCursor(r.nextCursor || null);
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!cursor) return;
    try {
      setErr("");
      setLoadingMore(true);

      const r = await apiGet(`/api/forum/topics?limit=20&cursor=${encodeURIComponent(cursor)}`);
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar mais");

      setRows((prev) => [...prev, ...(r.rows || [])]);
      setCursor(r.nextCursor || null);
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setLoadingMore(false);
    }
  }

  async function createTopic() {
    setCreating(true);
    setErr("");

    try {
      const tagsArr = tags
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 6);

      const r = await apiFetch("/api/forum/topics", {
        method: "POST",
        auth: true,
        body: { title: title.trim(), body: body.trim(), tags: tagsArr },
      });

      if (!r?.ok) throw new Error(r?.error || "Falha ao criar tópico");

      // limpa form e recarrega lista
      setTitle("");
      setBody("");
      setTags("");
      await loadFirst();
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await loadFirst();
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AuthGate>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <h1 style={{ fontSize: 34, marginBottom: 6 }}>Comunidade</h1>
        <div style={{ opacity: 0.8, marginBottom: 18 }}>
          Tópicos do Reino — peça ajuda, compartilhe conquistas e ideias.
        </div>

        {/* Criar tópico */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Criar novo tópico</div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do tópico"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              outline: "none",
              marginBottom: 10,
            }}
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escreva seu tópico..."
            rows={5}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              outline: "none",
              marginBottom: 10,
              resize: "vertical",
            }}
          />

          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (opcional): ex. arco, postura, staccato"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "white",
              outline: "none",
              marginBottom: 12,
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={createTopic}
              disabled={!canSubmit || creating}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.10)",
                color: "white",
                cursor: "pointer",
                opacity: !canSubmit || creating ? 0.6 : 1,
              }}
            >
              {creating ? "Criando..." : "Publicar tópico"}
            </button>

            <button
              onClick={loadFirst}
              style={{
                padding: "10px 14px",
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
        </div>

        {loading ? <div style={{ opacity: 0.8 }}>Carregando tópicos...</div> : null}

        {err ? (
          <div
            style={{
              border: "1px solid rgba(255,80,80,0.35)",
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            ❌ {err}
          </div>
        ) : null}

        {!loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {(rows || []).map((t) => (
              <TopicCard key={t.id} t={t} />
            ))}
          </div>
        ) : null}

        {!loading && cursor ? (
          <div style={{ marginTop: 14 }}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
                color: "white",
                cursor: "pointer",
                opacity: loadingMore ? 0.7 : 1,
              }}
            >
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        ) : null}

        {!loading && !cursor && (rows?.length || 0) > 0 ? (
          <div style={{ marginTop: 14, opacity: 0.7, fontSize: 12 }}>Fim da lista.</div>
        ) : null}
      </div>
    </AuthGate>
  );
}