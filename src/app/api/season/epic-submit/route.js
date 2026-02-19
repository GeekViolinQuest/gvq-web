import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function getApiUrl() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  return raw.replace(/\/$/, "");
}

export async function POST(req) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") || "";
  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${API_URL}/api/season/epic-submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
