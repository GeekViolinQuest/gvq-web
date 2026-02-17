export default async function Home() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  let data: any = null;
  let err: string | null = null;

  try {
    const r = await fetch(`${API}/healthz`, { cache: "no-store" });
    data = await r.json();
  } catch (e: any) {
    err = e?.message || "Erro ao chamar API";
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui, Arial" }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>GVQ — Web</h1>

      <p>
        API alvo: <code>{API}</code>
      </p>

      {err ? (
        <pre style={{ background: "#111", color: "#f66", padding: 16 }}>
          {err}
        </pre>
      ) : (
        <pre style={{ background: "#111", color: "#6f6", padding: 16 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
