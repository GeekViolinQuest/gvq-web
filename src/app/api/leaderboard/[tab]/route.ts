import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiUrl() {
  return (process.env.API_URL || "").replace(/\/$/, "");
}

function forwardAuth(req: Request) {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  return h;
}

export async function GET(req: Request, ctx: { params: { tab: string } }) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor (gvq-web)" },
      { status: 500 }
    );
  }

  const tab = String(ctx.params?.tab || "").trim();
  if (!tab) {
    return NextResponse.json({ ok: false, error: "Tab inválida" }, { status: 400 });
  }

  const url = new URL(req.url);
  const qs = url.search || "";

  // ✅ assumindo backend com prefixo /api
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