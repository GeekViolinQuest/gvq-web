"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function LinkedContent() {
  const sp = useSearchParams();
  const ok = sp.get("ok");
  const error = sp.get("error");

  return (
    <>
      {ok === "1" ? (
        <p>✅ Vinculado com sucesso.</p>
      ) : (
        <p>❌ Falhou: {error || "erro desconhecido"}</p>
      )}

      <p style={{ marginTop: 12 }}>
        <Link href="/dashboard" style={{ color: "white" }}>
          Voltar ao dashboard
        </Link>
      </p>
    </>
  );
}

export default function LinkedPage() {
  return (
    <main style={{ padding: 24, color: "white" }}>
      <h1>Vínculo do Discord</h1>
      <div style={{ opacity: 0.8, marginBottom: 14 }}>
        (Legado / migração — o site funciona mesmo sem Discord.)
      </div>

      <Suspense fallback={<p>Carregando...</p>}>
        <LinkedContent />
      </Suspense>
    </main>
  );
}