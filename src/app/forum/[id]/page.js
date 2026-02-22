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

function ReplyBubble({ r }) {
  const when = r?.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : "";
  return (
    <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 900 }}>{r.authorName || "Guardião"}</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>{when}</div>
      </div>
      <div style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.45, opacity: 0.9 }}>
        {r.body}
      </div>
    </div>
  );
}

export default function ForumTopicPage({ params }) {
  const topicId = params?.id;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [topic, setTopic] = useState(null);
  const [replies, setReplies] = useState([]);

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const canReply = useMemo(() => reply.trim().length > 0, [reply]);

  async function load() {
    try {
      setErr("");
      setLoading(true);

      const r = await apiGet(`/api/forum/topics/${topicId}`);
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar tópico");

      setTopic(r.topic || null);
      setReplies(r.replies || []);
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!canReply) return;
    setSending(true);
    setErr("");

    try {
      const r = await apiFetch(`/api/forum/topics/${topicId}/replies`, {
        method: "POST",
        auth: true,
        body: { body: reply.trim() },
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao responder");

      setReply("");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  return (
    <AuthGate>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div style={{ marginBottom: 14, opacity: 0.85 }}>
          <Link href="/forum" style={{ color: "white", textDecoration: "none" }}>
            ← Voltar para Comunidade
          </Link>
        </div>

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
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {topic.isPinned ? <span style={{ fontSize: 12, opacity: 0.9 }}>📌 Fixado</span> : null}
                {topic.isLocked ? <span style={{ fontSize: 12, opacity: 0.9 }}>🔒 Bloqueado</span> : null}
                <div style={{ fontSize: 22, fontWeight: 1000 }}>{topic.title}</div>
              </div>

              <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
                Por <b>{topic.authorName || "Guardião"}</b> •{" "}
                {topic.createdAt ? new Date(topic.createdAt).toLocaleString("pt-BR") : ""}
              </div>

              {(topic.tags || []).length ? (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(topic.tags || []).map((x) => (
                    <span
                      key={`tag-${x}`}
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.12)",
                        opacity: 0.9,
                      }}
                    >
                      {x}
                    </span>
                  ))}
                </div>
              ) : null}

              <div style={{ marginTop: 14, whiteSpace: "pre-wrap", lineHeight: 1.5, opacity: 0.92 }}>
                {topic.body}
              </div>
            </Card>

            {/* Replies */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 1000, marginBottom: 8 }}>Respostas ({replies.length})</div>

              <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, overflow: "hidden" }}>
                {replies.length ? (
                  replies.map((r) => <ReplyBubble key={r.id} r={r} />)
                ) : (
                  <div style={{ padding: 12, opacity: 0.8 }}>Ainda não há respostas.</div>
                )}
              </div>
            </div>

            {/* Reply box */}
            <div style={{ marginTop: 14 }}>
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
                    <button
                      onClick={sendReply}
                      disabled={!canReply || sending}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(255,255,255,0.10)",
                        color: "white",
                        cursor: "pointer",
                        opacity: !canReply || sending ? 0.6 : 1,
                      }}
                    >
                      {sending ? "Enviando..." : "Publicar resposta"}
                    </button>

                    <button
                      onClick={load}
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
                </>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AuthGate>
  );
}