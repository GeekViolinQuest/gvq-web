import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getApiUrl() {
  return (process.env.API_URL || "").trim().replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida (gvq-web)" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") || "";
  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${API_URL}/api/season/epic-submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}