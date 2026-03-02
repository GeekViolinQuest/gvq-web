"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiMe, clearMeCache, clearToken, getToken } from "@/lib/api";
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
      // Rotas públicas
      if (isPublic) {
        const token = getToken();
        if (token) {
          const r = await apiMe({ maxAgeMs: 10_000 }); // cache curtinho aqui
          if (r.ok) {
            router.replace("/dashboard");
            return;
          }
          // só limpa token se for 401/403
          if (r.status === 401 || r.status === 403) {
            clearMeCache();
            clearToken();
          }
        }
        if (alive) setReady(true);
        return;
      }

      // Rotas privadas
      const token = getToken();
      if (!token) {
        clearMeCache();
        clearToken();
        router.replace("/login");
        return;
      }

      // ✅ cache 60s: troca de página fica instantânea
      const r = await apiMe({ maxAgeMs: 60_000 });

      if (!alive) return;

      if (!r.ok) {
        // ✅ Só desloga se realmente for “token inválido”
        if (r.status === 401 || r.status === 403) {
          clearMeCache();
          clearToken();
          router.replace("/login");
          return;
        }

        // ✅ 5xx / rede: mantém sessão e deixa passar (não trava)
        // opcional: você pode exibir um toast "Servidor instável"
        setReady(true);
        return;
      }

      setReady(true);
    }

    // ❌ Não derruba a tela em toda troca de rota.
    // Só derruba se ainda não ficou pronto nenhuma vez.
    setReady((prev) => prev || false);

    run();

    function onStorage(e) {
      if (e.key === "gvq_token" && !e.newValue) {
        if (!isPublic) router.replace("/login");
      }
    }

    window.addEventListener("storage", onStorage);
    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [router, pathname, isPublic]);

  if (!ready) {
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