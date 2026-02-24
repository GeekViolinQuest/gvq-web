import { NextResponse } from "next/server";

function getApiUrl() {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

export async function proxyToApi(req, apiPath, { method = "GET", requireAuth = false } = {}) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL/NEXT_PUBLIC_API_URL não definida no servidor (Zeabur)" },
      { status: 500 }
    );
  }

  // ✅ repassa Authorization do browser -> Next -> API
  const authHeader = req.headers.get("authorization") || "";

  if (requireAuth && !authHeader) {
    return NextResponse.json({ ok: false, error: "missing_auth" }, { status: 401 });
  }

  // body só se não for GET/HEAD
  const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());
  const body = hasBody ? await req.json().catch(() => ({})) : undefined;

  const r = await fetch(`${API_URL}${apiPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    cache: "no-store",
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}