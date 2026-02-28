import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function getApiUrl() {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

export async function POST(req: Request) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));

  // ✅ modo A: NÃO seta cookie. Só repassa o JSON pro front,
  // e o front salva o token em localStorage (setToken).
  return NextResponse.json(data, { status: r.status });
}