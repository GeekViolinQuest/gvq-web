"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LinkedPage() {
  const sp = useSearchParams();
  const ok = sp.get("ok");
  const error = sp.get("error");

  return (
    <main style={{ padding: 24 }}>
      <h1>Vínculo do Discord</h1>
      {ok === "1" ? <p>✅ Vinculado com sucesso.</p> : <p>❌ Falhou: {error || "erro desconhecido"}</p>}
      <p style={{ marginTop: 12 }}>
        <Link href="/dashboard">Voltar ao dashboard</Link>
      </p>
    </main>
  );
}
