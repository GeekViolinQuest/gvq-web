// src/app/api/_helpers/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getApiUrl() {
  return (process.env.API_URL || "").replace(/\/$/, "");
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

  // ✅ repassa headers importantes (especialmente Authorization)
  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

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

  // devolve exatamente o que veio (JSON ou não)
  const out = await r.text();
  return new NextResponse(out, {
    status: r.status,
    headers: {
      "Content-Type": r.headers.get("content-type") || "application/json",
    },
  });
}