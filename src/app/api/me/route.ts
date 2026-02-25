// src/app/api/me/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proxyToBackend } from "../_helpers/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  console.log("[NEXT /api/me] auth header?", auth ? auth.slice(0, 20) + "..." : "MISSING");
  return proxyToBackend(req, `/api/me`);
}