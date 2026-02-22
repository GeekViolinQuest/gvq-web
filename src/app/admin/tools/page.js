"use client";

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
      {children}
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

  // reset season
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetExpected, setResetExpected] = useState(""); // mostra o texto exato caso API retorne

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
        // API manda expected quando confirmação não bate
        if (r?.expected) setResetExpected(r.expected);
        throw new Error(r?.error || "Falha ao resetar");
      }

      setMsg(
        `✅ Season resetada! Cristais zerados para todos. (modified: ${r.modified ?? "—"})`
      );
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
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "32px 18px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 34, marginBottom: 6 }}>Painel do Guardião Mestre — Tools</h1>
            <div style={{ opacity: 0.8 }}>
              Ajustes manuais (cristais) e reset global da Season.
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/admin/alunos" style={{ color: "white", textDecoration: "none", opacity: 0.9 }}>
              ← Ver Alunos
            </Link>
          </div>
        </div>

        {msg ? <div style={{ marginTop: 14, color: "#9ae6b4" }}>{msg}</div> : null}
        {err ? <div style={{ marginTop: 14, color: "#feb2b2" }}>❌ {err}</div> : null}

        <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {/* Ajuste de Cristais */}
          <Card>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>💎 Ajustar Cristais</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                  Email (opcional — você pode usar só email)
                </div>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: aluno@email.com"
                />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
                  userId (opcional — você pode usar só userId)
                </div>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="ex: 65f0c1..."
                />
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
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="ex: 2"
                  type="number"
                />
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

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
              Dica: se você veio da página de alunos, o <b>userId</b> já vem preenchido no link.
            </div>
          </Card>

          {/* Reset global */}
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
    </AuthGate>
  );
}