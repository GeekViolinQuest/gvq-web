// src/app/api/_proxy/[...path]/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getApiUrl() {
  const raw = process.env.API_URL || "";
  return raw.replace(/\/$/, "");
}

async function handler(req: Request, ctx: { params: { path: string[] } }) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL não definida no servidor" },
      { status: 500 }
    );
  }

  const path = (ctx.params?.path || []).join("/");
  const url = new URL(req.url);
  const target = `${API_URL}/${path}${url.search || ""}`;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);

  const r = await fetch(target, {
    method,
    headers,
    cache: "no-store",
    body: hasBody ? await req.text() : undefined,
  });

  const contentType = r.headers.get("content-type") || "";

  // repassa JSON quando for JSON
  if (contentType.includes("application/json")) {
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  }

  // fallback texto
  const text = await r.text().catch(() => "");
  return new NextResponse(text, {
    status: r.status,
    headers: { "content-type": contentType },
  });
}

export async function GET(req: Request, ctx: any) {
  return handler(req, ctx);
}
export async function POST(req: Request, ctx: any) {
  return handler(req, ctx);
}
export async function PUT(req: Request, ctx: any) {
  return handler(req, ctx);
}
export async function PATCH(req: Request, ctx: any) {
  return handler(req, ctx);
}
export async function DELETE(req: Request, ctx: any) {
  return handler(req, ctx);
}