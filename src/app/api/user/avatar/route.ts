// src/app/api/user/avatar/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
// garante runtime node (evita limitações chatas de edge em alguns deploys)
export const runtime = "nodejs";

function getApiBase() {
  // ✅ use primeiro API_URL (server-only), e cai pra NEXT_PUBLIC_API_URL se precisar
  const v = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  return v.replace(/\/$/, "");
}

function isHttpUrl(v: string) {
  return /^https?:\/\/.+/i.test(v);
}

function isDataImageUrl(v: string) {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(v);
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization") || "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const avatarUrl = String(body?.avatarUrl || "").trim();

    // ✅ valida URL ou DataURL (base64)
    if (avatarUrl && !isHttpUrl(avatarUrl) && !isDataImageUrl(avatarUrl)) {
      return NextResponse.json(
        { ok: false, error: "Formato inválido (use URL https ou arquivo pequeno)." },
        { status: 400 }
      );
    }

    const apiBase = getApiBase();
    if (!apiBase) {
      return NextResponse.json({ ok: false, error: "missing_api_base" }, { status: 500 });
    }

    const upstream = await fetch(`${apiBase}/api/user/avatar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      cache: "no-store",
      body: JSON.stringify({ avatarUrl }),
    });

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}