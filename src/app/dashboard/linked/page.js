export const dynamic = "force-dynamic";

"use client";

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
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </p>
    </>
  );
}

export default function LinkedPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Vínculo do Discord</h1>
      <Suspense fallback={<p>Carregando...</p>}>
        <LinkedContent />
      </Suspense>
    </main>
  );
}
