// src/app/api/season/my-submissions/route.ts
import type { NextRequest } from "next/server";
import { proxyToBackend } from "../../_helpers/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  return proxyToBackend(req, `/api/season/my-submissions`);
}