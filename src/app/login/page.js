"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GVQShell from "@/components/GVQShell";
import { apiRequest, getToken } from "@/lib/api";
import { GVQButton, GVQInput, GVQAlert } from "@/components/ui/GVQ";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("info"); // info | error | success
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) router.replace("/dashboard");
  }, [router]);

  async function requestOtp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setMsgType("error");
      setMessage("Digite seu e-mail.");
      return;
    }

    setLoading(true);
    setMessage("");
    setMsgType("info");

    const r = await apiRequest("/api/auth/request-otp", {
      method: "POST",
      auth: false,
      body: { email: cleanEmail },
    });

    setLoading(false);

    if (!r.ok) {
      setMsgType("error");
      setMessage(r.data?.error || `Erro ao enviar código (HTTP ${r.status})`);
      return;
    }

    setMsgType("success");
    setMessage("✅ Código enviado. Abrindo o Portal...");

    router.push(`/otp?email=${encodeURIComponent(cleanEmail)}`);
  }

  return (
    <GVQShell
      title="Entrada na Taverna"
      subtitle="Receba o Código do Guardião por e-mail"
      footer={
        <>
          📩 Se não chegar em 1–2 minutos, confira o spam.
          <br />
          ⏳ Reenvio respeita cooldown (anti-spam).
        </>
      }
      accent={msgType === "error" ? "error" : msgType === "success" ? "success" : "default"}
    >
      <div style={{ opacity: 0.9, fontSize: 14, lineHeight: 1.45 }}>
        Digite seu e-mail para receber o <b>Código do Guardião</b>.
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 13, opacity: 0.75 }}>E-mail</div>

        <GVQInput
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          disabled={loading}
          autoComplete="email"
        />

        <GVQButton
          full
          onClick={requestOtp}
          disabled={!email.trim()}
          loading={loading}
          loadingLabel="Enviando"
          variant="primary"
          style={{ marginTop: 14 }}
        >
          Enviar código
        </GVQButton>

        {message ? <GVQAlert type={msgType}>{message}</GVQAlert> : null}
      </div>
    </GVQShell>
  );
}