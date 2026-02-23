"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken, apiGet } from "@/lib/api";
import LoadingDots from "@/components/LoadingDots";

export default function AuthGate({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      const token = getToken();

      if (!token) {
        clearToken();
        router.replace("/login");
        return;
      }

      // valida token com /me (evita loops de páginas sem dados)
      const r = await apiGet("/api/user/me", { auth: true });

      if (!alive) return;

      if (!r.ok) {
        // 401/403: token inválido/expirado
        clearToken();
        router.replace("/login");
        return;
      }

      setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div style={{ padding: 32, color: "white" }}>
        <LoadingDots label="Abrindo o Portal" />
      </div>
    );
  }

  return children;
}