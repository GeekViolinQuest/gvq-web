// src/app/api/admin/[...path]/route.ts
import type { NextRequest } from "next/server";
import { proxyToBackend } from "../../_helpers/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handler(req: NextRequest, ctx: any) {
  const p = ctx?.params ? await ctx.params : {};
  const rest = (p?.path || []).join("/");
  return proxyToBackend(req, `/api/admin/${rest}`);
}

export async function GET(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function POST(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function PUT(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: any) {
  return handler(req, ctx);
}