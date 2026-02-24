import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getApiUrl() {
  const raw = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").trim();
  return raw.replace(/\/$/, "");
}

type Ctx = { params: { path: string[] } };

async function handler(req: NextRequest, ctx: Ctx) {
  const API_URL = getApiUrl();
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL (ou NEXT_PUBLIC_API_URL) não definida no servidor" },
      { status: 500 }
    );
  }

  const path = (ctx.params?.path || []).join("/");
  const url = new URL(req.url);

  const target = `${API_URL}/api/${path}${url.search || ""}`;

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
  const status = r.status;

  if (contentType.includes("application/json")) {
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status });
  }

  const text = await r.text().catch(() => "");
  return new NextResponse(text, { status, headers: { "content-type": contentType } });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return handler(req, ctx);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return handler(req, ctx);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return handler(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return handler(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return handler(req, ctx);
}