import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { JOBS } from "@/lib/jobs";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // jobs disabled until a secret is configured
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Scheduled-job endpoint: POST /api/jobs/{name} with the CRON_SECRET bearer
 * token. Point your scheduler (Vercel Cron, GitHub Actions, etc.) here.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ job: string }> },
) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { job } = await params;
  const runner = JOBS[job];
  if (!runner) {
    return NextResponse.json({ error: "unknown job" }, { status: 404 });
  }

  const startedAt = Date.now();
  const result = await runner();
  return NextResponse.json(
    { job, ...result, durationMs: Date.now() - startedAt },
    { status: result.ok ? 200 : 500 },
  );
}
