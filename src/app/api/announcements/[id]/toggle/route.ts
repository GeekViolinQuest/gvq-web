import type { NextRequest } from "next/server";
import { proxyToBackend } from "../../../_helpers/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyToBackend(req, `/api/announcements/${params.id}/toggle`);
}