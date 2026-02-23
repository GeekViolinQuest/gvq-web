// src/app/api/user/avatar/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiBase() {
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization") || "";
    if (!token) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const avatarUrl = String(body?.avatarUrl || "").trim();

    // valida URL simples
    if (avatarUrl && !/^https?:\/\/.+/i.test(avatarUrl)) {
      return NextResponse.json({ ok: false, error: "invalid_url" }, { status: 400 });
    }

    const apiBase = getApiBase();
    if (!apiBase) {
      return NextResponse.json({ ok: false, error: "missing_api_base" }, { status: 500 });
    }

    // Ajuste o path abaixo para bater com sua rota no Express
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