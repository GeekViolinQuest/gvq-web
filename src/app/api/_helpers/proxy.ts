// src/app/api/_helpers/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getApiUrl() {
  const raw = (process.env.API_URL || "").trim().replace(/\/$/, "");
  if (!raw) return "";
  // ✅ força https (evita treta http/https em prod)
  if (raw.startsWith("http://")) return raw.replace(/^http:\/\//, "https://");
  return raw;
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

  const url = new URL(backendPath, API_URL);
  const search = req.nextUrl.search;
  if (search) url.search = search;

  const headers = new Headers();

  const accept = req.headers.get("accept");
  if (accept) headers.set("accept", accept);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  // ✅ repassa cookie também (não atrapalha)
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  const auth = req.headers.get("authorization");
  const hasValidBearer = !!(auth && /^Bearer\s+.+/i.test(auth));

  if (hasValidBearer) {
    headers.set("authorization", auth!);
    headers.set("Authorization", auth!);
  } else {
    const token =
      req.cookies.get("gvq_token")?.value ||
      getTokenFromCookieHeader(req.headers.get("cookie"));

    if (token) {
      const v = `Bearer ${token}`;
      headers.set("authorization", v);
      headers.set("Authorization", v);
    }
  }

  let body: string | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const txt = await req.text();
    body = txt || undefined;
  }

  try {
    const r = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const out = await r.text();

    return new NextResponse(out, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    // ✅ aqui vai aparecer o motivo REAL (DNS, TLS, ECONNRESET, etc.)
    console.error("[proxyToBackend] fetch failed:", {
      to: url.toString(),
      message: err?.message,
      code: err?.code,
      cause: err?.cause,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "proxy_fetch_failed",
        to: url.toString(),
        message: String(err?.message || err),
        code: err?.code || null,
      },
      { status: 502 }
    );
  }
}