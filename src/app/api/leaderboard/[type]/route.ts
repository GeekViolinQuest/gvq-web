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
  context: { params: { type: string } }
) {
  const API_URL = getApiUrl();

  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida" },
      { status: 500 }
    );
  }

  const type = context.params.type?.toLowerCase();

  if (!ALLOWED.has(type)) {
    return NextResponse.json(
      { ok: false, error: "Tipo inválido de leaderboard" },
      { status: 404 }
    );
  }

  const auth = request.headers.get("authorization") || "";

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") || "10";

  const r = await fetch(
    `${API_URL}/api/leaderboard/${type}?limit=${encodeURIComponent(limit)}`,
    {
      method: "GET",
      headers: { Authorization: auth },
      cache: "no-store",
    }
  );

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}