import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getApiUrl() {
  return (process.env.API_URL || "").trim().replace(/\/$/, "");
}

export async function GET(req: NextRequest) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida (gvq-web)" }, { status: 500 });
  }

  const auth = req.headers.get("authorization") || "";

  const r = await fetch(`${API_URL}/api/meta/catalog`, {
    method: "GET",
    headers: auth ? { Authorization: auth } : {},
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}