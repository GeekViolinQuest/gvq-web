"use client";

import { useEffect, useState } from "react";
import { apiFetch, clearToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [state, setState] = useState({ loading: true, data: null, err: "" });
  const router = useRouter();

  async function load() {
    const r = await apiFetch("/api/user/progress-lite", { auth: true });
    if (!r.ok) {
      const err = r.data?.error || `Erro (${r.status})`;
      return setState({ loading: false, data: null, err });
    }
    setState({ loading: false, data: r.data, err: "" });
  }

  async function connectDiscord() {
    const r = await apiFetch("/api/discord/connect-url", { auth: true });
    if (!r.ok) return alert(r.data?.error || "Erro ao gerar link do Discord");
    // API deve retornar { ok:true, url:"..." } (se o teu endpoint usa outro campo, me diga)
    window.location.href = r.data.url;
  }

  function logout() {
    clearToken();
    router.push("/login");
  }

  useEffect(() => {
    load();
  }, []);

  if (state.loading) return <main style={{ padding: 24 }}>Carregando...</main>;

  if (state.err) {
    return (
      <main style={{ padding: 24 }}>
        <p>Erro: {state.err}</p>
        <button onClick={logout} style={{ padding: 12, marginTop: 12 }}>
          Voltar pro login
        </button>
      </main>
    );
  }

  const p = state.data?.progress;

  return (
    <main style={{ padding: 24 }}>
      <h1>GVQ — Dashboard</h1>

      <pre style={{ background: "#111", color: "#0f0", padding: 12, marginTop: 12, overflow: "auto" }}>
        {JSON.stringify(state.data, null, 2)}
      </pre>

      {state.data?.linked ? (
        <p style={{ marginTop: 12 }}>✅ Discord vinculado</p>
      ) : (
        <>
          <p style={{ marginTop: 12 }}>⚠️ Discord não vinculado</p>
          <button onClick={connectDiscord} style={{ padding: 12, marginTop: 12 }}>
            Vincular Discord
          </button>
        </>
      )}

      <button onClick={logout} style={{ padding: 12, marginTop: 24 }}>
        Sair
      </button>
    </main>
  );
}
