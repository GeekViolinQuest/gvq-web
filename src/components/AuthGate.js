"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet, clearToken, getToken } from "@/lib/api";
import GVQShell from "@/components/GVQShell";
import LoadingDots from "@/components/LoadingDots";

export default function AuthGate({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const publicRoutes = useMemo(() => new Set(["/login", "/otp"]), []);
  const isPublic = publicRoutes.has(pathname);

  useEffect(() => {
    let alive = true;

    async function run() {
      // ✅ Rotas públicas não exigem validação
      if (isPublic) {
        const token = getToken();
        if (token) {
          const r = await apiGet("/api/user/me", { auth: true });
          if (r.ok) {
            router.replace("/dashboard"); // ou /perfil
            return;
          }
          clearToken();
        }
        if (alive) setReady(true);
        return;
      }

      const token = getToken();

      // ❌ Sem token em rota privada -> login
      if (!token) {
        clearToken();
        router.replace("/login");
        return;
      }

      // ✅ Valida token (rota interna do Next)
      const r = await apiGet("/api/user/me", { auth: true });

      if (!alive) return;

      if (!r.ok) {
        clearToken();
        router.replace("/login");
        return;
      }

      setReady(true);
    }

    setReady(false); // sempre que trocar de rota, reavalia
    run();

    // Se você fizer logout em outra aba, essa aba acompanha (em rotas privadas)
    function onStorage(e) {
      if (e.key === "gvq_token" && !e.newValue) {
        if (!isPublic) {
          router.replace("/login");
        }
      }
    }

    window.addEventListener("storage", onStorage);

    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [router, pathname, isPublic]);

  if (!ready) {
    // ✅ evita tela preta
    return (
      <GVQShell title="GVQ — Portal de Entrada" subtitle="Preparando seu acesso...">
        <div style={{ paddingTop: 10, opacity: 0.9 }}>
          <LoadingDots label="Carregando" />
        </div>
      </GVQShell>
    );
  }

  return children;
}