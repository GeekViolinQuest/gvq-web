"use client";

import AuthGate from "@/components/AuthGate";
import GMGate from "@/components/GMGate";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

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

function Input({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        color: "white",
        outline: "none",
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={6}
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
  );
}

function Button({ children, onClick, disabled, variant = "primary" }) {
  const bg =
    variant === "danger"
      ? "rgba(255, 80, 80, 0.18)"
      : variant === "ghost"
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.10)";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.12)",
        background: bg,
        color: "white",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// ISO week (YYYY-Www)
function getISOWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // quinta-feira determina o ano ISO
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);

  return `${date.getUTCFullYear()}-W${pad2(weekNo)}`;
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function fmtBR(d) {
  try {
    return d.toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const r = await apiGet("/api/announcements?limit=20", { auth: true });
      if (!r?.ok) throw new Error(r?.error || "Falha ao carregar avisos");
      setItems(r.items || []);
    } catch (e) {
      setItems([]);
      setErr(e?.message || "Erro ao carregar avisos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function post() {
    const t = title.trim();
    const c = content.trim();
    if (!t || !c) {
      setErr("Preencha título e conteúdo.");
      return;
    }

    setPosting(true);
    setMsg("");
    setErr("");

    try {
      const r = await apiPost("/api/announcements", { title: t, content: c }, { auth: true });
      if (!r?.ok) throw new Error(r?.error || "Falha ao postar");

      setMsg("✅ Aviso publicado!");
      setTitle("");
      setContent("");
      await load();
    } catch (e) {
      setErr(e?.message || "Erro ao postar");
    } finally {
      setPosting(false);
    }
  }

  // ===== Templates =====
  function fillTemplateWeekly() {
    const wk = getISOWeekKey(new Date());
    const deadline = fmtBR(addDays(new Date(), 6)); // “até domingo” aproximado

    setTitle(`Quest da Semana — ${wk}`);
    setContent(
`Guardiões,

🎻 QUEST DA SEMANA — ${wk}

🔹 Desafio:
[Descreva aqui a Quest da Semana em 1–2 linhas]

📌 Regras:
- [Regra 1]
- [Regra 2]
- [Regra 3]

⏳ Prazo:
Até ${deadline} (23:59)

📤 Entrega:
Poste o seu link na aba Season Quests.

✨ Recompensa:
+2 Cristais Sonoros

Boa caça, Guardiões. 🐾`
    );

    setMsg("📝 Template de Quest da Semana aplicado. Ajuste e publique.");
    setErr("");
  }

  function fillTemplateEpic() {
    const wk = getISOWeekKey(new Date());
    const deadline = fmtBR(addDays(new Date(), 14)); // épica ~15 dias

    setTitle(`Quest Épica — ${wk}`);
    setContent(
`Guardiões,

⚔️ QUEST ÉPICA — ${wk}

🔥 Missão:
[Explique a Quest Épica e o evento em 2–4 linhas]

📌 Regras:
- [Regra 1]
- [Regra 2]
- [Regra 3]

⏳ Janela do Evento:
Até ${deadline} (23:59)

📤 Entrega:
Poste o seu link na aba Season Quests.

🏆 Recompensa:
+5 Cristais Sonoros

Que a chama do Arco Místico guie tua jornada. ✨`
    );

    setMsg("📝 Template de Quest Épica aplicado. Ajuste e publique.");
    setErr("");
  }

  return (
    <AuthGate>
      <GMGate>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 34, marginBottom: 6 }}>📣 Avisos do GM</h1>
              <div style={{ opacity: 0.8 }}>Publicar avisos que aparecem no dashboard dos alunos.</div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/admin" style={{ color: "white", textDecoration: "none", opacity: 0.9 }}>
                ← Voltar ao Admin
              </Link>
              <Button onClick={load} variant="ghost" disabled={loading || posting}>
                🔄 Atualizar
              </Button>
            </div>
          </div>

          {msg ? <div style={{ marginTop: 14, color: "#9ae6b4" }}>{msg}</div> : null}
          {err ? <div style={{ marginTop: 14, color: "#feb2b2" }}>❌ {err}</div> : null}

          <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
            <Card>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>Criar novo aviso</div>

              {/* ===== Botões de template ===== */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <Button variant="ghost" onClick={fillTemplateWeekly} disabled={posting}>
                  🧭 Template: Quest da Semana
                </Button>
                <Button variant="ghost" onClick={fillTemplateEpic} disabled={posting}>
                  ⚔️ Template: Quest Épica
                </Button>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título (ex: Quest da Semana — 2026-W08)"
                />
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={"Conteúdo do aviso...\n\nDica: você pode colar regras, prazo e links."}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button onClick={post} disabled={posting || !title.trim() || !content.trim()}>
                    {posting ? "Publicando..." : "Publicar aviso"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTitle("");
                      setContent("");
                      setMsg("");
                      setErr("");
                    }}
                    disabled={posting}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ fontWeight: 1000, marginBottom: 10 }}>Avisos ativos (mais recentes)</div>

              {loading ? (
                <div style={{ opacity: 0.75 }}>Carregando...</div>
              ) : items?.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {items.map((it) => (
                    <div
                      key={it._id || it.createdAt}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 12,
                        padding: 12,
                        background: "rgba(255,255,255,0.02)",
                      }}
                    >
                      <div style={{ fontWeight: 1000 }}>{it.title}</div>
                      <div style={{ marginTop: 6, opacity: 0.85, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                        {it.content}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
                        {it.createdAt ? new Date(it.createdAt).toLocaleString("pt-BR") : ""}
                        {it.createdBy ? ` • por ${it.createdBy}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ opacity: 0.75 }}>Nenhum aviso ainda.</div>
              )}
            </Card>
          </div>
        </div>
      </GMGate>
    </AuthGate>
  );
}