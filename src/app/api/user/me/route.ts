import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function getApiUrl() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  return raw.replace(/\/$/, "");
}

export async function GET(req: Request) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL/NEXT_PUBLIC_API_URL não definida" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization") || "";

  const r = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      // repassa exatamente como veio do browser
      Authorization: auth,
    },
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}