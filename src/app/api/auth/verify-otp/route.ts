import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

function getApiUrl() {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

function isProd() {
  return process.env.NODE_ENV === "production";
}

export async function POST(req: Request) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));

  const r = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));

  const res = NextResponse.json(data, { status: r.status });

  // ✅ Se o backend devolveu token, salvamos em cookie httpOnly
  const token = data?.token;
  if (r.ok && token) {
    res.cookies.set({
      name: "gvq_token",
      value: String(token),
      httpOnly: true,
      secure: isProd(),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });
  }

  return res;
}