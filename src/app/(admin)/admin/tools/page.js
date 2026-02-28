"use client";

import GMGate from "@/components/GMGate";
import AuthGate from "@/components/AuthGate";
import { apiFetch } from "@/lib/api";
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
      {children}import GMGate from "@/components/GMGate";
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
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

function Button({ children, onClick, disabled, variant = "primary", title }) {
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
      title={title}
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

function clampInt(raw, min, max) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const v = Math.trunc(n);
  if (v < min || v > max) return null;
  return v;
}

export default function AdminToolsPage() {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  const [mode, setMode] = useState("inc"); // inc | dec | set
  const [amount, setAmount] = useState("2");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // ===== SEARCH =====
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  // reset season
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetExpected, setResetExpected] = useState("");

  // prefill via querystring (?userId=...&email=...)
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const qUserId = qs.get("userId");
      const qEmail = qs.get("email");
      if (qUserId) setUserId(qUserId);
      if (qEmail) setEmail(qEmail);
    } catch {
      // ignore
    }
  }, []);

  const amountInt = useMemo(() => clampInt(amount, 1, 500), [amount]);

  const canAdjust = useMemo(() => {
    const hasTarget = userId.trim() || email.trim();
    return !!hasTarget && !!amountInt && ["inc", "dec", "set"].includes(mode);
  }, [userId, email, amountInt, mode]);

  async function search() {
    const qq = q.trim();
    if (!qq) {
      setResults([]);
      return;
    }

    setSearching(true);
    setErr("");
    try {
      const r = await apiFetch(
        `/api/admin/cristais/search?q=${encodeURIComponent(qq)}&limit=20`,
        { method: "GET", auth: true }
      );
      if (!r?.ok) throw new Error(r?.error || "Falha na busca");
      setResults(r.rows || []);
    } catch (e) {
      setResults([]);
      setErr(e?.message || "Erro na busca");
    } finally {
      setSearching(false);
    }
  }

  function useTarget(row) {
    const uid = row?.userId || "";
    const em = row?.acesso?.email || "";
    if (uid) setUserId(uid);
    if (em) setEmail(em);

    setMsg(
      `🎯 Alvo selecionado: ${row?.acesso?.displayName || row?.acesso?.nomeReal || em || uid}`
    );
  }

  async function adjustCristais() {
    setLoading(true);
    setMsg("");
    setErr("");
    setResetExpected("");

    try {
      const r = await apiFetch("/api/admin/cristais/adjust", {
        method: "POST",
        auth: true,
        body: {
          userId: userId.trim() || undefined,
          email: email.trim() || undefined,
          mode,
          amount: amountInt,
        },
      });

      if (!r?.ok) throw new Error(r?.error || "Falha ao ajustar");

      const label =
        mode === "inc" ? `+${amountInt}` : mode === "dec" ? `-${amountInt}` : `= ${amountInt}`;

      setMsg(`✅ Cristais ajustados (${label}). Total agora: ${r.cristais ?? "—"} 💎`);
    } catch (e) {
      setErr(e?.message || "Erro ao ajustar");
    } finally {
      setLoading(false);
    }
  }

  async function quickAdjust(nextMode, nextAmount) {
    setMode(nextMode);
    setAmount(String(nextAmount));

    const hasTarget = userId.trim() || email.trim();
    if (!hasTarget) {
      setErr("Escolha um alvo (userId ou email) antes de usar atalho.");
      return;
    }

    if (nextMode === "set" && nextAmount === 0) {
      setLoading(true);
      setMsg("");
      setErr("");
      setResetExpected("");
      try {
        const r = await apiFetch("/api/admin/cristais/set", {
          method: "POST",
          auth: true,
          body: {
            userId: userId.trim() || undefined,
            email: email.trim() || undefined,
            value: 0,
          },
        });
        if (!r?.ok) throw new Error(r?.error || "Falha ao definir cristais");
        setMsg(`✅ Cristais definidos para 0. Total agora: ${r.cristais ?? "—"} 💎`);
      } catch (e) {
        setErr(e?.message || "Erro ao definir cristais");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setMsg("");
    setErr("");
    setResetExpected("");
    try {
      const r = await apiFetch("/api/admin/cristais/adjust", {
        method: "POST",
        auth: true,
        body: {
          userId: userId.trim() || undefined,
          email: email.trim() || undefined,
          mode: nextMode,
          amount: nextAmount,
        },
      });
      if (!r?.ok) throw new Error(r?.error || "Falha ao ajustar");

      const label =
        nextMode === "inc"
          ? `+${nextAmount}`
          : nextMode === "dec"
            ? `-${nextAmount}`
            : `= ${nextAmount}`;

      setMsg(`✅ Cristais ajustados (${label}). Total agora: ${r.cristais ?? "—"} 💎`);
    } catch (e) {
      setErr(e?.message || "Erro ao ajustar");
    } finally {
      setLoading(false);
    }
  }

  async function resetSeason() {
    setLoading(true);
    setMsg("");
    setErr("");

    try {
      const r = await apiFetch("/api/admin/cristais/reset-season", {
        method: "POST",
        auth: true,
        body: { confirm: resetConfirm.trim().toUpperCase() },
      });

      if (!r?.ok) {
        if (r?.expected) setResetExpected(r.expected);
        throw new Error(r?.error || "Falha ao resetar");
      }

      setMsg(`✅ Season resetada! Cristais zerados para todos. (modified: ${r.modified ?? "—"})`);
      setResetConfirm("");
      setResetExpected("");
    } catch (e) {
      setErr(e?.message || "Erro ao resetar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate>
      <GMGate></GMGate>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>Painel do Guardião Mestre — Tools</h1>
            <div style={{ opacity: 0.8 }}>Ajustes manuais (cristais) e reset global da Season.</div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/admin" style={{ color: "white", textDecoration: "none", opacity: 0.9 }}>
              ← HUB Admin
            </Link>
            <Link href="/admin/alunos" style={{ color: "white", textDecoration: "none", opacity: 0.9 }}>
              Ver Alunos
            </Link>
          </div>
        </div>

        {msg ? <div style={{ marginTop: 14, color: "#9ae6b4" }}>{msg}</div> : null}
        {err ? <div style={{ marginTop: 14, color: "#feb2b2" }}>❌ {err}</div> : null}

        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          <Card>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>🔎 Buscar aluno (Acesso + Aluno)</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 10 }}>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="email, nome, displayName, userId..."
              />
              <Button onClick={search} disabled={loading || searching || !q.trim()}>
                {searching ? "Buscando..." : "Buscar"}
              </Button>
            </div>

            {results?.length ? (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {results.map((r) => (
                  <div
                    key={r.userId || r?.acesso?.id || r?.aluno?.id}
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      borderRadius: 12,
                      padding: 12,
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: 13, opacity: 0.95 }}>
                      <div style={{ fontWeight: 900 }}>
                        {r?.acesso?.displayName || r?.acesso?.nomeReal || "—"}
                        <span style={{ opacity: 0.75, fontWeight: 400 }}>
                          {" "}
                          • {r?.acesso?.email || "sem email"}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4, lineHeight: 1.35 }}>
                        userId: <b>{r.userId || "—"}</b>
                        {"  "}• cristais: <b>{r?.aluno?.cristais ?? "—"}</b>
                        {"  "}• level: <b>{r?.aluno?.level ?? "—"}</b>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <Button variant="ghost" onClick={() => useTarget(r)} disabled={loading}>
                        Usar alvo
                      </Button>

                      <a
                        href={`/admin/tools?userId=${encodeURIComponent(r.userId || "")}&email=${encodeURIComponent(
                          r?.acesso?.email || ""
                        )}`}
                        style={{
                          color: "white",
                          textDecoration: "none",
                          opacity: 0.85,
                          fontSize: 12,
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          padding: "10px 12px",
                          background: "rgba(255,255,255,0.06)",
                        }}
                        title="Abrir com target preenchido"
                      >
                        Abrir
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                {q.trim() ? "Sem resultados (ou busque novamente)." : "Digite algo e clique Buscar."}
              </div>
            )}
          </Card>

          <Card>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>💎 Ajustar Cristais</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                  Email (opcional — você pode usar só email)
                </div>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: aluno@email.com" />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                  userId (opcional — você pode usar só userId)
                </div>
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="ex: 65f0c1..." />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Modo</div>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "white",
                    outline: "none",
                  }}
                >
                  <option value="inc">Somar (inc)</option>
                  <option value="dec">Remover (dec)</option>
                  <option value="set">Definir (set)</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Quantidade (1..500)</div>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="ex: 2" type="number" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <Button onClick={adjustCristais} disabled={loading || !canAdjust}>
                {loading ? "Aplicando..." : "Aplicar ajuste"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setMsg("");
                  setErr("");
                }}
                disabled={loading}
              >
                Limpar mensagens
              </Button>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button variant="ghost" onClick={() => quickAdjust("inc", 1)} disabled={loading}>
                +1
              </Button>
              <Button variant="ghost" onClick={() => quickAdjust("inc", 2)} disabled={loading}>
                +2
              </Button>
              <Button variant="ghost" onClick={() => quickAdjust("inc", 5)} disabled={loading}>
                +5
              </Button>
              <Button variant="ghost" onClick={() => quickAdjust("dec", 2)} disabled={loading}>
                -2
              </Button>
              <Button variant="ghost" onClick={() => quickAdjust("dec", 5)} disabled={loading}>
                -5
              </Button>
              <Button variant="danger" onClick={() => quickAdjust("set", 0)} disabled={loading} title="Define 0 via /set">
                SET 0
              </Button>
            </div>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Dica: se você veio da página de alunos, o <b>userId</b> já vem preenchido no link.
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>🧨 Reset global da Season (zerar cristais)</div>

            <div style={{ opacity: 0.85, fontSize: 13, lineHeight: 1.4 }}>
              Isso zera <b>cristais</b> de todos os alunos e também reseta o <b>Primeiro Estelar</b> da Temporada ativa.
              <br />
              Para evitar acidentes, precisa de uma confirmação do tipo:
              <br />
              <b>RESETAR 2026-W08</b> (a API diz a semana certa).
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                Confirmação
                {resetExpected ? (
                  <span style={{ marginLeft: 8, opacity: 0.9 }}>
                    (esperado: <b>{resetExpected}</b>)
                  </span>
                ) : null}
              </div>
              <Input
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder='ex: "RESETAR 2026-W08"'
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              <Button
                variant="danger"
                onClick={resetSeason}
                disabled={loading || resetConfirm.trim().length < 8}
                title="Ação irreversível (por enquanto)."
              >
                {loading ? "Resetando..." : "Resetar cristais do servidor"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setResetConfirm("");
                  setResetExpected("");
                }}
                disabled={loading}
              >
                Limpar confirmação
              </Button>
            </div>
          </Card>
        </div>

        <div style={{ marginTop: 18, opacity: 0.75, fontSize: 12 }}>
          Observação: se o GM digitar errado, a API retorna o texto exato esperado.
        </div>
      </div>
     <GMGate></GMGate> 
    </AuthGate>
  );
}