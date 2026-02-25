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
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor (gvq-web)" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Não autenticado" }, { status: 401 });
  }

  const r = await fetch(`${API_URL}/api/me`, {
    method: "GET",
    headers: { Authorization: auth },
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}