import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getApiBase() {
  const raw = (process.env.API_URL || "").trim();
  return raw.replace(/\/$/, "");
}

function cloneHeaders(req: NextRequest) {
  const h = new Headers();

  // repassa Authorization (principal)
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);

  // repassa content-type quando existir
  const ct = req.headers.get("content-type");
  if (ct) h.set("content-type", ct);

  // (opcional) repassa accept-language etc
  const al = req.headers.get("accept-language");
  if (al) h.set("accept-language", al);

  return h;
}

export async function proxyToBackend(req: NextRequest, backendPath: string) {
  const API_BASE = getApiBase();
  if (!API_BASE) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor (gvq-web)" },
      { status: 500 }
    );
  }

  // preserva querystring
  const qs = req.nextUrl.search || "";
  const target = `${API_BASE}${backendPath}${qs}`;

  const method = req.method.toUpperCase();
  const headers = cloneHeaders(req);

  let body: any = undefined;
  if (method !== "GET" && method !== "HEAD") {
    // importante: não tentar ler body em GET/HEAD
    body = await req.text().catch(() => "");
  }

  const upstream = await fetch(target, {
    method,
    headers,
    cache: "no-store",
    body: body && body.length ? body : undefined,
  });

  const contentType = upstream.headers.get("content-type") || "";

  // devolve json/text preservando status
  if (contentType.includes("application/json")) {
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  }

  const text = await upstream.text().catch(() => "");
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": contentType || "text/plain; charset=utf-8" },
  });
}