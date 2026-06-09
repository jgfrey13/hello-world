import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/guard';
import { route, json, notFound } from '@/lib/http';

interface Params {
  params: { id: string };
}

// POST /api/admin/projects/[id]/flag — flag or unflag a project (admin only).
// Body: { flagged: boolean, reason?: string }
export const POST = route(async (req: NextRequest, { params }: Params) => {
  await requireRole('ADMIN');
  const body = await req.json().catch(() => ({}));
  const flagged = body.flagged !== false; // default to flagging

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) throw notFound('Project not found.');

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      isFlagged: flagged,
      flagReason: flagged ? (typeof body.reason === 'string' ? body.reason.slice(0, 300) : 'Flagged by admin') : null,
      // Flagging hides it from the public board; unflagging restores OPEN if it
      // was previously open.
      status: flagged ? 'FLAGGED' : project.status === 'FLAGGED' ? 'OPEN' : project.status,
    },
  });

  return json({ project: updated });
});
