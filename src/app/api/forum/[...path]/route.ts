import type { NextRequest } from "next/server";
import { proxyToBackend } from "../../_helpers/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function pickRest(ctx: any) {
  // Next pode tipar params como Promise em algumas versões
  const p = ctx?.params;
  return p;
}

export async function GET(req: NextRequest, ctx: any) {
  const p = (await pickRest(ctx)) || {};
  const rest = (p?.path || []).join("/");
  return proxyToBackend(req, `/api/forum/${rest}`);
}

export async function POST(req: NextRequest, ctx: any) {
  const p = (await pickRest(ctx)) || {};
  const rest = (p?.path || []).join("/");
  return proxyToBackend(req, `/api/forum/${rest}`);
}