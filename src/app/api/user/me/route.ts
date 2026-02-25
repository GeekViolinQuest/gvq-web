import type { NextRequest } from "next/server";
import { proxyToBackend } from "../../_helpers/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // ✅ força compatibilidade: /api/me vira /api/user/me
  return proxyToBackend(req, `/api/user/me`);
}