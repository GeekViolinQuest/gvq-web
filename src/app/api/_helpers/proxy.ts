// src/app/api/_helpers/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getApiUrl() {
  const base = (process.env.API_URL || "").replace(/\/$/, "");
  return base;
}

function stripHopByHopHeaders(headers: Headers) {
  // headers que não devem ser repassados
  const banned = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "host",
  ]);
  const out = new Headers();
  for (const [k, v] of headers.entries()) {
    if (!banned.has(k.toLowerCase())) out.set(k, v);
  }
  return out;
}

export async function proxyToBackend(req: NextRequest, path: string) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json({ ok: false, error: "API_URL não definida no servidor" }, { status: 500 });
  }

  // ✅ copia headers DO CLIENTE, incluindo Authorization
  const headers = stripHopByHopHeaders(req.headers);

  // (opcional, mas bom) garante que o backend saiba que é JSON quando for o caso
  // NÃO força Content-Type em GET
  // headers.set("Accept", "application/json");

  const url = `${API_URL}${path}`;

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  // ✅ repassa body em métodos que podem ter body
  if (!["GET", "HEAD"].includes(req.method)) {
    // NextRequest pode ser lido como ArrayBuffer uma vez
    const body = await req.arrayBuffer();
    init.body = body.byteLength ? body : undefined;
  }

  const r = await fetch(url, init);

  // ✅ devolve o body e status pro browser
  const contentType = r.headers.get("content-type") || "";
  const resHeaders = new Headers(r.headers);

  if (contentType.includes("application/json")) {
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status, headers: resHeaders });
  }

  const text = await r.text().catch(() => "");
  return new NextResponse(text, { status: r.status, headers: resHeaders });
}