import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getApiUrl() {
  return (process.env.API_URL || "").trim().replace(/\/$/, "");
}

export async function proxyToBackend(req: NextRequest, backendPath: string) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor (gvq-web)" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization") || "";
  const headers = new Headers();
  if (auth) headers.set("authorization", auth);

  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  const target = `${API_URL}${backendPath}${req.nextUrl.search || ""}`;

  const r = await fetch(target, {
    method,
    headers,
    cache: "no-store",
    body: hasBody ? await req.text() : undefined,
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