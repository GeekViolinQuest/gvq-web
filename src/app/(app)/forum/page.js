"use client";

import AuthGate from "@/components/AuthGate";
import GVQShell from "@/components/GVQShell";
import LoadingDots from "@/components/LoadingDots";
import { apiFetch, apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

function Button({ onClick, children, disabled, variant = "solid", title, style }) {
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
        ...style,
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
        width: "100%",
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

function Textarea(props) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "white",
        outline: "none",
        resize: "vertical",
        ...props.style,
      }}
    />
  );
}

function Avatar({ name, url, size = 28 }) {
  const initial = String(name || "G").trim().slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(255,255,255,0.08)",
        display: "grid",
        placeItems: "center",
        flex: "0 0 auto",
      }}
      title={name || "Guardião"}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name || "avatar"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span style={{ fontWeight: 1000, fontSize: 12, opacity: 0.95 }}>{initial}</span>
      )}
    </div>
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
    <Link href={`/forum/${t.id}`} style={{ textDecoration: "none", color: "white" }}>
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
          <Avatar name={t.authorName} url={t.authorAvatarUrl} />
          {t.isPinned ? <span style={{ fontSize: 12, opacity: 0.9 }}>📌 Fixado</span> : null}
          {t.isLocked ? <span style={{ fontSize: 12, opacity: 0.9 }}>🔒 Bloqueado</span> : null}
          {t.category === "ajuda" ? (
            <span style={{ fontSize: 12, opacity: 0.9 }}>
              {t.status === "resolved" ? "☑️ Resolvido" : "✅ Aberto"}
            </span>
          ) : null}
          <div style={{ fontWeight: 1000, fontSize: 16 }}>{t.title}</div>
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

          <div style={{ fontSize: 12, opacity: 0.75, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>💬 {t.repliesCount ?? 0}</span>
            <span>
              {t.likedByMe ? "❤️" : "🤍"} {t.likesCount ?? 0}
            </span>
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
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = (searchParams.get("category") || "geral").toLowerCase();
  const status = (searchParams.get("status") || "").toLowerCase(); // open|resolved (só ajuda)
  const tag = (searchParams.get("tag") || "").toLowerCase();

  const CATEGORIES = useMemo(
    () => [
      { key: "geral", label: "Geral" },
      { key: "ajuda", label: "Ajuda" },
      { key: "tecnica", label: "Técnica" },
      { key: "mao-esquerda", label: "Mão Esquerda" },
      { key: "mao-direita", label: "Mão Direita / Arco" },
      { key: "musicas", label: "Músicas" },
      { key: "teoria", label: "Teoria" },
      { key: "season", label: "Season Quests" },
    ],
    []
  );

  function setQs(next) {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v) sp.delete(k);
      else sp.set(k, String(v));
    });
    router.replace(`/forum?${sp.toString()}`);
  }

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

  // UI do filtro de TAG (campo controlado, mas a fonte da verdade é o querystring)
  const [tagInput, setTagInput] = useState(tag);

  useEffect(() => {
    setTagInput(tag || "");
  }, [tag]);

  const canSubmit = useMemo(() => {
    const t = title.trim();
    const b = body.trim();
    return t.length >= 3 && b.length >= 3;
  }, [title, body]);

  function buildListUrl({ withCursor } = { withCursor: false }) {
    const base =
      `/api/forum/topics?limit=20` +
      `&category=${encodeURIComponent(category)}` +
      (category === "ajuda" && status ? `&status=${encodeURIComponent(status)}` : "") +
      (tag ? `&tag=${encodeURIComponent(tag)}` : "");

    if (!withCursor) return base;
    if (!cursor) return base;

    return (
      `/api/forum/topics?limit=20&cursor=${encodeURIComponent(cursor)}` +
      `&category=${encodeURIComponent(category)}` +
      (category === "ajuda" && status ? `&status=${encodeURIComponent(status)}` : "") +
      (tag ? `&tag=${encodeURIComponent(tag)}` : "")
    );
  }

  async function loadFirst() {
    setErr("");
    setLoading(true);

    const url = buildListUrl({ withCursor: false });
    const r = await apiGet(url, { auth: true });

    if (!r?.ok) {
      setErr(r?.error || "Falha ao carregar tópicos");
      setLoading(false);
      return;
    }

    // ✅ apiGet -> dados em r.data
    setRows(r.data?.rows || []);
    setCursor(r.data?.nextCursor || null);
    setLoading(false);
  }

  async function loadMore() {
    if (!cursor) return;

    setErr("");
    setLoadingMore(true);

    const url = buildListUrl({ withCursor: true });
    const r = await apiGet(url, { auth: true });

    setLoadingMore(false);

    if (!r?.ok) {
      setErr(r?.error || "Falha ao carregar mais");
      return;
    }

    // ✅ apiGet -> dados em r.data
    setRows((prev) => [...prev, ...(r.data?.rows || [])]);
    setCursor(r.data?.nextCursor || null);
  }

  async function createTopic() {
    setCreating(true);
    setErr("");

    const tagsArr = tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 6);

    const r = await apiFetch("/api/forum/topics", {
      method: "POST",
      auth: true,
      body: {
        title: title.trim(),
        body: body.trim(),
        tags: tagsArr,
        category,
        status: category === "ajuda" ? (status || "open") : undefined,
      },
    });

    setCreating(false);

    if (!r?.ok) {
      setErr(r?.error || "Falha ao criar tópico");
      return;
    }

    // limpa form e recarrega lista
    setTitle("");
    setBody("");
    setTags("");
    await loadFirst();
  }

  // ✅ recarrega ao mudar aba/filtro
  useEffect(() => {
    // reset do cursor local quando muda filtro
    setCursor(null);
    loadFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, tag]);

  return (
    <AuthGate>
      <GVQShell
        title="Comunidade"
        subtitle="Tópicos do Reino — peça ajuda, compartilhe conquistas e ideias."
        right={
          <Button onClick={() => loadFirst()} variant="ghost" disabled={loading || creating}>
            🔄 Atualizar
          </Button>
        }
      >
        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {CATEGORIES.map((c) => (
            <Button
              key={c.key}
              variant={category === c.key ? "solid" : "ghost"}
              onClick={() =>
                setQs({
                  category: c.key,
                  // ao trocar de aba, limpa filtros específicos
                  status: c.key === "ajuda" ? "open" : "",
                  tag: "",
                })
              }
              style={{ padding: "8px 10px" }}
              disabled={loading || creating}
            >
              {c.label}
            </Button>
          ))}
        </div>

        {/* Ajuda: Open/Resolved */}
        {category === "ajuda" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <Button
              variant={status !== "resolved" ? "solid" : "ghost"}
              onClick={() => setQs({ status: "open" })}
              style={{ padding: "8px 10px" }}
              disabled={loading || creating}
            >
              ✅ Abertos
            </Button>
            <Button
              variant={status === "resolved" ? "solid" : "ghost"}
              onClick={() => setQs({ status: "resolved" })}
              style={{ padding: "8px 10px" }}
              disabled={loading || creating}
            >
              ☑️ Resolvidos
            </Button>
          </div>
        ) : null}

        {/* Filtro por tag (querystring) */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 16,
            background: "rgba(255,255,255,0.03)",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 900 }}>🔎 Filtro</div>

          <div style={{ flex: 1, minWidth: 240 }}>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Tag (ex: arco, staccato, zelda) — opcional"
              disabled={loading || creating}
            />
          </div>

          <Button
            variant="ghost"
            onClick={() => setQs({ tag: tagInput.trim().toLowerCase() })}
            disabled={loading || creating}
            title="Aplicar filtro por tag"
          >
            Aplicar
          </Button>

          <Button
            variant="ghost"
            onClick={() => setQs({ tag: "" })}
            disabled={loading || creating}
            title="Limpar tag"
          >
            Limpar
          </Button>
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
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>Criar novo tópico</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Categoria: <b>{category}</b>
              {category === "ajuda" ? (
                <>
                  {" "}
                  • Status: <b>{status || "open"}</b>
                </>
              ) : null}
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do tópico"
              disabled={creating}
            />

            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva seu tópico..."
              rows={5}
              disabled={creating}
            />

            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (opcional): ex. arco, postura, staccato"
              disabled={creating}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button onClick={createTopic} disabled={!canSubmit || creating} variant="solid">
                {creating ? "Publicando..." : "Publicar tópico"}
              </Button>

              <Button onClick={() => loadFirst()} disabled={loading || creating} variant="ghost">
                🔄 Atualizar lista
              </Button>
            </div>
          </div>
        </div>

        {loading ? <LoadingDots label="Invocando os tópicos" /> : null}

        {err ? (
          <div style={{ border: "1px solid rgba(255,80,80,0.35)", padding: 12, borderRadius: 12 }}>
            ❌ {err}
          </div>
        ) : null}

        {!loading && !err ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {(rows || []).map((t) => (
              <TopicCard key={t.id} t={t} />
            ))}
          </div>
        ) : null}

        {!loading && cursor ? (
          <div style={{ marginTop: 14 }}>
            <Button onClick={loadMore} disabled={loadingMore} variant="ghost" style={{ width: "100%" }}>
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </Button>
          </div>
        ) : null}

        {!loading && !cursor && (rows?.length || 0) > 0 ? (
          <div style={{ marginTop: 14, opacity: 0.7, fontSize: 12 }}>Fim da lista.</div>
        ) : null}
      </GVQShell>
    </AuthGate>
  );
}