import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function getApiUrl() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  return raw.replace(/\/$/, "");
}

export async function GET(req: Request) {
  const API_URL = process.env.API_URL;
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") || "";

  const r = await fetch(`${API_URL}/api/user/me`, {
    method: "GET",
    headers: { Authorization: auth },
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
