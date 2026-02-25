import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function getApiUrl() {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

function getTokenFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)gvq_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function GET(req: Request) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida" }, { status: 500 });
  }

  const token = getTokenFromCookie(req);
  if (!token) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }

  const r = await fetch(`${API_URL}/api/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`, // ✅ o teu authRequired exige isso
    },
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}