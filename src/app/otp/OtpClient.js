"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GVQShell from "@/components/GVQShell";
import { apiRequest, getToken, setToken } from "@/lib/api";
import { GVQButton, GVQInput, GVQAlert, Row } from "@/components/ui/GVQ";

export default function OtpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");

  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info"); // info | error | success

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) router.replace("/dashboard");
  }, [router]);

  async function verifyOtp(e) {
    e.preventDefault();
    setMsg("");
    setMsgType("info");

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (!cleanEmail) {
      setMsgType("error");
      return setMsg("Digite seu e-mail.");
    }
    if (cleanCode.length !== 6) {
      setMsgType("error");
      return setMsg("Digite o código de 6 dígitos.");
    }

    setLoading(true);

    const r = await apiRequest("/api/auth/verify-otp", {
      method: "POST",
      auth: false,
      body: { email: cleanEmail, code: cleanCode },
    });

    setLoading(false);

    if (!r.ok) {
      setMsgType("error");
      return setMsg(r.data?.error || "Erro ao verificar OTP");
    }

    if (!r.data?.token) {
      setMsgType("error");
      return setMsg("Resposta inválida do servidor (sem token).");
    }

    setToken(r.data.token);
    setMsgType("success");
    setMsg("✅ Portal aberto! Entrando no Dashboard...");

    router.replace("/dashboard");
  }

  async function resendOtp() {
    setMsg("");
    setMsgType("info");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMsgType("error");
      return setMsg("Digite seu e-mail para reenviar o código.");
    }

    setSending(true);

    const r = await apiRequest("/api/auth/request-otp", {
      method: "POST",
      auth: false,
      body: { email: cleanEmail },
    });

    setSending(false);

    if (!r.ok) {
      setMsgType("error");
      return setMsg(r.data?.error || `Não foi possível reenviar (HTTP ${r.status})`);
    }

    setMsgType("success");
    setMsg("✅ Código reenviado. Verifique seu e-mail (e o spam).");
  }

  function changeEmail() {
    router.replace("/login");
  }

  const accent = msgType === "error" ? "error" : msgType === "success" ? "success" : "default";

  return (
    <GVQShell
      title="Ritual do Código"
      subtitle="Insira o Código do Guardião para abrir o Portal"
      footer={
        <>
          ⏳ Reenviar respeita cooldown (anti-spam).
          <br />
          🧙‍♂️ Dica: copie e cole o código do e-mail.
        </>
      }
      accent={accent}
    >
      <form onSubmit={verifyOtp}>
        <div style={{ fontSize: 13, opacity: 0.75 }}>E-mail</div>

        <GVQInput
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={loading || sending}
          autoComplete="email"
        />

        <div style={{ marginTop: 14, fontSize: 13, opacity: 0.75 }}>Código (6 dígitos)</div>

        <GVQInput
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          disabled={loading}
          inputMode="numeric"
          style={{ width: 200, letterSpacing: 6, fontWeight: 900 }}
        />

        <GVQButton
          full
          type="submit"
          variant="primary"
          loading={loading}
          loadingLabel="Validando"
          disabled={code.trim().length !== 6}
          style={{ marginTop: 14 }}
        >
          Entrar
        </GVQButton>

        <Row style={{ marginTop: 12 }}>
          <GVQButton
            variant="ghost"
            onClick={resendOtp}
            loading={sending}
            loadingLabel="Reenviando"
            disabled={loading}
          >
            Reenviar código
          </GVQButton>

          <GVQButton variant="ghost" onClick={changeEmail} disabled={loading || sending}>
            Trocar e-mail
          </GVQButton>
        </Row>
      </form>

      {msg ? <GVQAlert type={msgType}>{msg}</GVQAlert> : null}
    </GVQShell>
  );
}