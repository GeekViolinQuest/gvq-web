// src/app/api/leaderboard/[type]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function getApiUrl() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  return raw.replace(/\/$/, "");
}

const ALLOWED = new Set(["level", "reliquias", "season"]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida" }, { status: 500 });
  }

  const { type } = await context.params;
  const normalizedType = String(type || "").toLowerCase();

  if (!ALLOWED.has(normalizedType)) {
    return NextResponse.json({ ok: false, error: "Tipo inválido de leaderboard" }, { status: 404 });
  }

  const auth = request.headers.get("authorization") || "";
  const { searchParams } = new URL(request.url);

  // ✅ repassa os params que o backend entende
  const limit = searchParams.get("limit") || "10";
  const page = searchParams.get("page") || "1";

  const url = new URL(`${API_URL}/api/leaderboard/${normalizedType}`);
  url.searchParams.set("limit", limit);
  url.searchParams.set("page", page);

  const r = await fetch(url.toString(), {
    method: "GET",
    headers: { Authorization: auth },
    cache: "no-store",
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}