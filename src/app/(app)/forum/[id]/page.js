"use client";

import AuthGate from "@/components/AuthGate";
import GVQShell from "@/components/GVQShell";
import { apiFetch, apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";

function Avatar({ src, name }) {
  const initial = (name || "G").trim().slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        flex: "0 0 auto",
        display: "grid",
        placeItems: "center",
        fontWeight: 900,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || "avatar"}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "";
          }}
        />
      ) : (
        <span style={{ opacity: 0.9 }}>{initial}</span>
      )}
    </div>
  );
}

function Button({ children, onClick, disabled, variant = "solid", title, style, type = "button" }) {
  const bg =
    variant === "danger"
      ? "rgba(255,80,80,0.18)"
      : variant === "ghost"
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.10)";

  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: bg,
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

function When({ dt }) {
  const when = dt ? new Date(dt).toLocaleString("pt-BR") : "";
  return <span style={{ fontSize: 12, opacity: 0.75 }}>{when}</span>;
}

export default function ForumTopicPage() {
  const params = useParams();
  const topicId = params?.id; // vem da rota /forum/[id]

  // ✅ FIX: router definido no App Router
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [me, setMe] = useState(null); // { userId, role }
  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);

  // reply
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  // edit topic
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);

  // edit reply
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyBody, setEditingReplyBody] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  const meUserId = me?.userId ? String(me.userId) : null;
  const isMod = me?.role === "gm" || me?.role === "admin";

  const canReply = useMemo(() => reply.trim().length > 0, [reply]);

  const canEditTopic = useMemo(() => {
    if (!topic || !meUserId) return false;
    return isMod || String(topic.authorUserId) === meUserId;
  }, [topic, meUserId, isMod]);

  async function loadMe() {
    // suportar 2 formatos (mantive teu comportamento)
    const a = await apiGet("/api/user/me", { auth: true });
    if (a?.ok && a.data?.me) {
      const m = a.data.me;
      setMe({
        userId: m.userId || m.id || m._id || null,
        role: m.role || null,
      });
      return;
    }

    const b = await apiGet("/api/user/me", { auth: true });
    if (b?.ok && b.data?.user) {
      const u = b.data.user;
      setMe({
        userId: u.userId || u.id || u._id || null,
        role: u.role || null,
      });
    }
  }

  async function load() {
    try {
      setErr("");
      setLoading(true);

      await loadMe();

      const r = await apiGet(`/api/forum/topics/${topicId}`, { auth: true });
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar tópico");

      const data = r.data;
      setTopic(data?.topic || null);
      setReplies(data?.replies || []);
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!topicId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  // ====== actions ======

  async function toggleLikeTopic() {
    if (!topic) return;
    const r = await apiFetch(`/api/forum/topics/${topic.id}/like`, { method: "POST", auth: true });
    if (!r?.ok) return setErr(r?.error || "Falha ao curtir");
    setTopic((prev) =>
      prev
        ? {
            ...prev,
            likedByMe: !!r.data?.liked,
            likesCount: r.data?.likesCount ?? prev.likesCount ?? 0,
          }
        : prev
    );
  }

  async function deleteTopic() {
    if (!topic) return;
    const ok = confirm("Excluir este tópico? (vai sumir da lista)");
    if (!ok) return;

    // ✅ FIX: usa topicId (param) e router definido
    const r = await apiFetch(`/api/forum/topics/${topicId}`, { method: "DELETE", auth: true });
    if (!r?.ok) return setErr(r?.error || "Falha ao excluir");

    router.replace("/forum"); // ✅ volta pra lista sem erro
    router.refresh(); // ✅ opcional: força revalidar a lista
  }

  function startEditTopic() {
    setEditMode(true);
    setEditTitle(topic?.title || "");
    setEditBody(topic?.body || "");
  }

  async function saveEditTopic() {
    if (!topic) return;
    setSavingTopic(true);
    setErr("");

    const r = await apiFetch(`/api/forum/topics/${topic.id}`, {
      method: "PATCH",
      auth: true,
      body: { title: editTitle, body: editBody },
    });

    setSavingTopic(false);

    if (!r?.ok) return setErr(r?.error || "Falha ao salvar");
    setEditMode(false);
    await load();
  }

  async function sendReply() {
    if (!canReply || !topic) return;
    setSending(true);
    setErr("");

    const r = await apiFetch(`/api/forum/topics/${topic.id}/replies`, {
      method: "POST",
      auth: true,
      body: { body: reply.trim() },
    });

    setSending(false);

    if (!r?.ok) return setErr(r?.error || "Falha ao responder");

    setReply("");
    await load();
  }

  async function toggleLikeReply(replyId) {
    const r = await apiFetch(`/api/forum/replies/${replyId}/like`, { method: "POST", auth: true });
    if (!r?.ok) return setErr(r?.error || "Falha ao curtir");

    setReplies((prev) =>
      (prev || []).map((x) =>
        x.id === replyId
          ? { ...x, likedByMe: !!r.data?.liked, likesCount: r.data?.likesCount ?? x.likesCount ?? 0 }
          : x
      )
    );
  }

  function startEditReply(r) {
    setEditingReplyId(r.id);
    setEditingReplyBody(r.body || "");
  }

  async function saveEditReply() {
    if (!editingReplyId) return;
    setSavingReply(true);
    setErr("");

    const r = await apiFetch(`/api/forum/replies/${editingReplyId}`, {
      method: "PATCH",
      auth: true,
      body: { body: editingReplyBody },
    });

    setSavingReply(false);

    if (!r?.ok) return setErr(r?.error || "Falha ao salvar resposta");

    setEditingReplyId(null);
    setEditingReplyBody("");
    await load();
  }

  async function deleteReply(replyId) {
    const ok = confirm("Excluir esta resposta?");
    if (!ok) return;

    const r = await apiFetch(`/api/forum/replies/${replyId}`, { method: "DELETE", auth: true });
    if (!r?.ok) return setErr(r?.error || "Falha ao excluir resposta");

    await load();
  }

  return (
    <AuthGate>
      <GVQShell
        title="Comunidade"
        subtitle="Tópico"
        right={
          <Link href="/forum" style={{ textDecoration: "none" }}>
            <Button variant="ghost">← Voltar</Button>
          </Link>
        }
      >
        {loading ? <div style={{ opacity: 0.8 }}>Carregando...</div> : null}

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

        {!loading && topic ? (
          <>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Avatar src={topic.authorAvatarUrl} name={topic.authorName} />
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      {topic.isPinned ? <span style={{ fontSize: 12, opacity: 0.9 }}>📌 Fixado</span> : null}
                      {topic.isLocked ? <span style={{ fontSize: 12, opacity: 0.9 }}>🔒 Bloqueado</span> : null}
                      <div style={{ fontSize: 20, fontWeight: 1000 }}>{topic.title}</div>
                    </div>
                    <div style={{ marginTop: 4, opacity: 0.8, fontSize: 13 }}>
                      Por <b>{topic.authorName || "Guardião"}</b> • <When dt={topic.createdAt} />
                      {topic.lastReplyAt ? (
                        <span style={{ marginLeft: 10, opacity: 0.8 }}>
                          • Última resposta: <When dt={topic.lastReplyAt} />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Button onClick={toggleLikeTopic} variant="ghost" title="Curtir">
                    {topic.likedByMe ? "❤️" : "🤍"} {topic.likesCount ?? 0}
                  </Button>

                  {canEditTopic ? (
                    <>
                      <Button onClick={() => (editMode ? setEditMode(false) : startEditTopic())} variant="ghost">
                        {editMode ? "✖ Cancelar" : "✏️ Editar"}
                      </Button>
                      <Button onClick={deleteTopic} variant="danger">
                        🗑️ Excluir
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>

              {(topic.tags || []).length ? (
                <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(topic.tags || []).map((x) => (
                    <Tag key={`tag-${x}`} text={x} />
                  ))}
                </div>
              ) : null}

              {!editMode ? (
                <div style={{ marginTop: 14, whiteSpace: "pre-wrap", lineHeight: 1.55, opacity: 0.92 }}>
                  {topic.body}
                </div>
              ) : (
                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      outline: "none",
                      fontWeight: 900,
                    }}
                    placeholder="Título"
                  />
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={8}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      outline: "none",
                      resize: "vertical",
                    }}
                    placeholder="Texto"
                  />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button onClick={saveEditTopic} disabled={savingTopic}>
                      {savingTopic ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button onClick={() => setEditMode(false)} variant="ghost" disabled={savingTopic}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Replies */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 1000, marginBottom: 8 }}>Respostas ({replies.length})</div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
                {replies.length ? (
                  replies.map((r) => {
                    const canEditReply = isMod || (meUserId && String(r.authorUserId) === meUserId);
                    const isEditing = editingReplyId === r.id;

                    return (
                      <div key={r.id} style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            <Avatar src={r.authorAvatarUrl} name={r.authorName} />
                            <div>
                              <div style={{ fontWeight: 900 }}>
                                {r.authorName || "Guardião"}{" "}
                                {r.isEdited ? <span style={{ fontSize: 12, opacity: 0.7 }}>(editado)</span> : null}
                              </div>
                              <When dt={r.createdAt} />
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <Button onClick={() => toggleLikeReply(r.id)} variant="ghost">
                              {r.likedByMe ? "❤️" : "🤍"} {r.likesCount ?? 0}
                            </Button>

                            {canEditReply ? (
                              <>
                                <Button
                                  onClick={() => (isEditing ? setEditingReplyId(null) : startEditReply(r))}
                                  variant="ghost"
                                >
                                  {isEditing ? "✖" : "✏️"}
                                </Button>
                                <Button onClick={() => deleteReply(r.id)} variant="danger" title="Excluir resposta">
                                  🗑️
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>

                        {!isEditing ? (
                          <div style={{ marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.45, opacity: 0.9 }}>
                            {r.body}
                          </div>
                        ) : (
                          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                            <textarea
                              value={editingReplyBody}
                              onChange={(e) => setEditingReplyBody(e.target.value)}
                              rows={4}
                              style={{
                                width: "100%",
                                padding: 12,
                                borderRadius: 12,
                                border: "1px solid rgba(255,255,255,0.12)",
                                background: "rgba(255,255,255,0.04)",
                                color: "white",
                                outline: "none",
                                resize: "vertical",
                              }}
                            />
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <Button onClick={saveEditReply} disabled={savingReply}>
                                {savingReply ? "Salvando..." : "Salvar"}
                              </Button>
                              <Button onClick={() => setEditingReplyId(null)} variant="ghost" disabled={savingReply}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 12, opacity: 0.8 }}>Ainda não há respostas.</div>
                )}
              </div>
            </div>

            {/* Reply box */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Responder</div>

              {topic.isLocked ? (
                <div style={{ opacity: 0.8 }}>🔒 Este tópico está bloqueado.</div>
              ) : (
                <>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />

                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <Button onClick={sendReply} disabled={!canReply || sending}>
                      {sending ? "Enviando..." : "Publicar resposta"}
                    </Button>

                    <Button onClick={load} variant="ghost">
                      🔄 Atualizar
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
      </GVQShell>
    </AuthGate>
  );
}