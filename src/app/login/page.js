"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GVQShell from "@/components/GVQShell";
import LoadingDots from "@/components/LoadingDots";
import { apiPost, setToken } from "@/lib/api";

function Card({ children }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        padding: 16,
        background: "rgba(255,255,255,0.04)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
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

function Button({ children, onClick, disabled, variant = "solid", title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 14px",
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

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [step, setStep] = useState("email"); // email | code
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setMessage("Digite seu e-mail.");

    setLoading(true);
    setMessage("");

    const r = await apiPost("/api/auth/request-otp", { email: cleanEmail }, { auth: false });

    setLoading(false);

    if (!r.ok) return setMessage(r.error || "Erro ao enviar código.");

    setStep("code");
    setMessage("✅ Código enviado. Verifique seu e-mail (e o spam).");
  }

  async function verifyOtp() {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      setMessage("Digite seu e-mail.");
      setStep("email");
      return;
    }
    if (cleanCode.length !== 6) return setMessage("Digite o código de 6 dígitos.");

    setLoading(true);
    setMessage("");

    const r = await apiPost(
      "/api/auth/verify-otp",
      { email: cleanEmail, code: cleanCode },
      { auth: false }
    );

    setLoading(false);

    if (!r.ok) return setMessage(r.error || "Código inválido.");

    const token = r.data?.token;
    if (!token) return setMessage("Token não retornou. Tente novamente.");

    setToken(token);
    router.replace("/dashboard");
  }

  function reset() {
    setCode("");
    setStep("email");
    setMessage("");
  }

  return (
    <GVQShell
      title="GVQ — Portal de Entrada"
      subtitle="Acesso por código mágico (OTP)"
    >
      <div style={{ maxWidth: 520 }}>
        <Card>
          <div style={{ fontWeight: 900, marginBottom: 10, opacity: 0.9 }}>
            {step === "email" ? "Informe seu e-mail" : "Digite o código recebido"}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 6 }}>E-mail</div>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || step === "code"}
              />
            </div>

            {step === "code" ? (
              <div>
                <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 6 }}>Código (6 dígitos)</div>
                <Input
                  inputMode="numeric"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={loading}
                  style={{ letterSpacing: 4, width: 200 }}
                />
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              {step === "email" ? (
                <Button onClick={requestOtp} disabled={loading || !email.trim()}>
                  {loading ? <LoadingDots label="Enviando" /> : "Enviar código"}
                </Button>
              ) : (
                <>
                  <Button onClick={verifyOtp} disabled={loading || code.trim().length !== 6}>
                    {loading ? <LoadingDots label="Validando" /> : "Confirmar"}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={requestOtp}
                    disabled={loading}
                    title="Reenviar (respeita o cooldown do backend)"
                  >
                    Reenviar
                  </Button>

                  <Button variant="ghost" onClick={reset} disabled={loading}>
                    Trocar e-mail
                  </Button>
                </>
              )}
            </div>

            {message ? (
              <div
                style={{
                  marginTop: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  padding: 10,
                  background: "rgba(255,255,255,0.03)",
                  opacity: 0.95,
                }}
              >
                {message}
              </div>
            ) : null}
          </div>
        </Card>

        <div style={{ marginTop: 14, opacity: 0.7, fontSize: 12, lineHeight: 1.4 }}>
          Dica: se o e-mail não chegar, olhe a aba de spam / promoções.  
          Se o código expirar, reenvie.
        </div>
      </div>
    </GVQShell>
  );
}