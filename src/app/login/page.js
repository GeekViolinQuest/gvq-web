"use client";

import { useState } from "react";
import { setToken } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [step, setStep] = useState("email"); // "email" | "code"
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMessage("Digite seu e-mail.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        setStep("code");
        setMessage("✅ Código enviado. Verifique seu e-mail (e o spam).");
      } else {
        setMessage(data?.error || "Erro ao enviar código.");
      }
    } catch {
      setMessage("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      setMessage("Digite seu e-mail.");
      setStep("email");
      return;
    }
    if (cleanCode.length !== 6) {
      setMessage("Digite o código de 6 dígitos.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok && data?.token) {
        setToken(data.token);
        setMessage("✅ Login confirmado! Token salvo.");
        // window.location.href = "/dashboard";
      } else {
        setMessage(data?.error || "Código inválido.");
      }
    } catch {
      setMessage("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCode("");
    setStep("email");
    setMessage("");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>GVQ — Login</h1>

      <div style={{ marginTop: 16 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Seu e-mail</label>
        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, width: 320 }}
          disabled={loading || step === "code"}
        />
      </div>

      {step === "code" && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "block", marginBottom: 6 }}>
            Código (6 dígitos)
          </label>
          <input
            inputMode="numeric"
            placeholder="000000"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            style={{ padding: 10, width: 140, letterSpacing: 4 }}
            disabled={loading}
          />
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {step === "email" ? (
          <button onClick={requestOtp} disabled={loading || !email.trim()}>
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        ) : (
          <>
            <button
              onClick={verifyOtp}
              disabled={loading || code.trim().length !== 6}
            >
              {loading ? "Confirmando..." : "Confirmar código"}
            </button>

            <button
              onClick={requestOtp}
              disabled={loading}
              style={{ marginLeft: 10 }}
              title="Reenviar (respeita o cooldown do backend)"
            >
              Reenviar código
            </button>

            <button
              onClick={reset}
              disabled={loading}
              style={{ marginLeft: 10 }}
            >
              Trocar e-mail
            </button>
          </>
        )}
      </div>

      <p style={{ marginTop: 14 }}>{message}</p>
    </div>
  );
}
