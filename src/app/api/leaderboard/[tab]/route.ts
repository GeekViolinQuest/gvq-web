import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function getApiUrl() {
  return (process.env.API_URL || "").replace(/\/$/, "");
}

function forwardAuth(req: NextRequest) {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  return h;
}

export async function GET(req: NextRequest, ctx: any) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor (gvq-web)" },
      { status: 500 }
    );
  }

  // ✅ compatível com ctx.params normal OU Promise (dependendo da tipagem do Next)
  const rawParams = ctx?.params ? await ctx.params : {};
  const tab = String(rawParams?.tab || "").trim();

  if (!tab) {
    return NextResponse.json({ ok: false, error: "Tab inválida" }, { status: 400 });
  }

  const qs = req.nextUrl?.search || "";

  // ✅ backend tem prefixo /api (confirmado pelo seu server.js)
  const target = `${API_URL}/api/leaderboard/${encodeURIComponent(tab)}${qs}`;

  const r = await fetch(target, {
    method: "GET",
    headers: forwardAuth(req),
    cache: "no-store",
  });

  const contentType = r.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  }

  const text = await r.text().catch(() => "");
  return new NextResponse(text, {
    status: r.status,
    headers: { "content-type": contentType || "text/plain; charset=utf-8" },
  });
}