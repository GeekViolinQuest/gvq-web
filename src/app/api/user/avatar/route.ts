// src/app/api/user/avatar/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getApiBase() {
  return (process.env.API_URL || "").trim().replace(/\/$/, "");
}

function isHttpUrl(v: string) {
  return /^https?:\/\/.+/i.test(v);
}

function isDataImageUrl(v: string) {
  return /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(v);
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization") || "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const avatarUrl = String(body?.avatarUrl || "").trim();

    // valida URL ou DataURL (base64)
    if (avatarUrl && !isHttpUrl(avatarUrl) && !isDataImageUrl(avatarUrl)) {
      return NextResponse.json(
        { ok: false, error: "Formato inválido (use URL https ou DataURL base64 pequena)." },
        { status: 400 }
      );
    }

    const apiBase = getApiBase();
    if (!apiBase) {
      return NextResponse.json({ ok: false, error: "API_URL não definida" }, { status: 500 });
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
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}