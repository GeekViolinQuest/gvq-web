import type { NextRequest } from "next/server";
import { proxyToBackend } from "../../_helpers/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getRest(ctx: any) {
  // Next pode tipar params como Promise
  const p = ctx?.params;
  return p?.then ? await p : p;
}

function buildRest(p: any) {
  const parts: string[] = Array.isArray(p?.path) ? p.path : [];
  const rest = parts.join("/");
  return rest ? `/api/forum/${rest}` : `/api/forum`;
}

export async function GET(req: NextRequest, ctx: any) {
  const p = await getRest(ctx);
  return proxyToBackend(req, buildRest(p));
}

export async function POST(req: NextRequest, ctx: any) {
  const p = await getRest(ctx);
  return proxyToBackend(req, buildRest(p));
}

export async function PATCH(req: NextRequest, ctx: any) {
  const p = await getRest(ctx);
  return proxyToBackend(req, buildRest(p));
}

export async function DELETE(req: NextRequest, ctx: any) {
  const p = await getRest(ctx);
  return proxyToBackend(req, buildRest(p));
}