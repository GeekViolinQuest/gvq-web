import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiUrl() {
  return (process.env.API_URL || "").replace(/\/$/, "");
}

export async function POST(req: Request) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor (gvq-web)" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${API_URL}/api/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}