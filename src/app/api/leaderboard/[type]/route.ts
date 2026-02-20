import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiUrl() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  return raw.replace(/\/$/, "");
}

const ALLOWED = new Set(["level", "reliquias", "season"]);

export async function GET(
  req: Request,
  ctx: { params: { type: string } }
) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida" },
      { status: 500 }
    );
  }

  const type = String(ctx?.params?.type || "").toLowerCase();
  if (!ALLOWED.has(type)) {
    return NextResponse.json(
      { ok: false, error: "Tipo inválido de leaderboard" },
      { status: 404 }
    );
  }

  const auth = req.headers.get("authorization") || "";

  const { searchParams } = new URL(req.url);
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