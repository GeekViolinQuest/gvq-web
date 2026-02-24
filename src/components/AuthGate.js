"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet, clearToken, getToken } from "@/lib/api";

export default function AuthGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      const token = getToken();

      // Sem token => login
      if (!token) {
        clearToken();
        if (pathname !== "/login") router.replace("/login");
        return;
      }

      // ✅ Opcional (recomendado): valida rapidamente se token ainda é aceito
      // Se quiser MUITO leve, você pode comentar esse bloco e fica só pelo localStorage.
      const r = await apiGet("/api/user/me", { auth: true });

      if (!alive) return;

      if (!r.ok) {
        // 401/403/etc => limpa e volta pro login
        clearToken();
        if (pathname !== "/login") router.replace("/login");
        return;
      }

      setReady(true);
    }

    run();

    // Se você fizer logout em outra aba, essa aba acompanha
    function onStorage(e) {
      if (e.key === "gvq_token" && !e.newValue) {
        if (pathname !== "/login") router.replace("/login");
      }
    }

    window.addEventListener("storage", onStorage);

    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [router, pathname]);

  if (!ready) return null;
  return children;
}