import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const API_URL = process.env.API_URL;
  if (!API_URL) return NextResponse.json({ ok: false, error: "API_URL não definida" }, { status: 500 });

  const r = await fetch(`${API_URL}/api/season/epic-active`, { cache: "no-store" });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
