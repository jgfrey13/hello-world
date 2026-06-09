import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/guard';
import { route, json } from '@/lib/http';

// GET /api/admin/projects — list projects with optional ?flagged=1 filter.
export const GET = route(async (req: NextRequest) => {
  await requireRole('ADMIN');
  const url = new URL(req.url);
  const flaggedOnly = url.searchParams.get('flagged') === '1';

  const projects = await prisma.project.findMany({
    where: flaggedOnly ? { isFlagged: true } : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      homeowner: { select: { email: true, profile: { select: { name: true } } } },
      _count: { select: { bids: true } },
    },
  });

  return json({ projects });
});
