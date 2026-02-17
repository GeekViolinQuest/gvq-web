"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, clearToken } from "@/lib/api";

type Props = {
  children: React.ReactNode;
  redirectTo?: string; // default: /login
};

export default function AuthGate({ children, redirectTo = "/login" }: Props) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // valida token no backend
        await apiFetch("/api/auth/me", { method: "GET", auth: true });
        if (alive) setOk(true);
      } catch {
        clearToken();
        if (alive) {
          setOk(false);
          setMsg("Sessão expirada. Faça login novamente.");
          window.location.href = redirectTo;
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [redirectTo]);

  if (ok === null) return <p style={{ padding: 24 }}>Verificando sessão...</p>;

  // se ok=false ele já redireciona
  return (
    <>
      {msg ? <p style={{ padding: 24 }}>{msg}</p> : null}
      {children}
    </>
  );
}
