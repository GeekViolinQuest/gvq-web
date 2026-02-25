// src/app/api/season/weekly-submit/route.ts
import type { NextRequest } from "next/server";
import { proxyToBackend } from "../../_helpers/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return proxyToBackend(req, `/api/season/weekly-submit`);
}