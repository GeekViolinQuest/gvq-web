// src/app/api/_helpers/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getApiUrl() {
  return (process.env.API_URL || "").replace(/\/$/, "");
}

function getTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/(?:^|;\s*)gvq_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function proxyToBackend(req: NextRequest, backendPath: string) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor (gvq-web)" },
      { status: 500 }
    );
  }

  // monta URL final no backend + preserva querystring
  const url = new URL(backendPath, API_URL);
  const search = req.nextUrl.search;
  if (search) url.search = search;

  // ===== headers =====
  const headers = new Headers();

  // Content negotiation (opcional, mas ok)
  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // ✅ AUTH: prioriza Authorization vindo do próprio request
  // mas se não vier, pega do cookie httpOnly "gvq_token"
  const auth = req.headers.get("authorization");
  if (auth) {
    headers.set("authorization", auth);
  } else {
    // NextRequest tem req.cookies, mas pra evitar diferença de runtime,
    // usamos também o header cookie como fallback.
    const token =
      req.cookies.get("gvq_token")?.value ||
      getTokenFromCookieHeader(req.headers.get("cookie"));

    if (token) headers.set("authorization", `Bearer ${token}`);
  }

  // body só quando necessário
  let body: string | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const txt = await req.text();
    body = txt || undefined;
  }

  const r = await fetch(url.toString(), {
    method: req.method,
    headers,
    body,
    cache: "no-store",
  });

  // devolve exatamente o que veio
  const out = await r.text();

  // ✅ repassa content-type do backend (senão quebra JSON/text)
  const respHeaders: Record<string, string> = {
    "Content-Type": r.headers.get("content-type") || "application/json",
  };

  return new NextResponse(out, {
    status: r.status,
    headers: respHeaders,
  });
}