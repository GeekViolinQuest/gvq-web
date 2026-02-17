import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const API_URL = process.env.API_URL;
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor (Zeabur)" },
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
