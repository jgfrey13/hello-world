import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/guard';
import { route, json } from '@/lib/http';

// GET /api/bids/mine — the current contractor's bids, with project context.
export const GET = route(async () => {
  const user = await requireRole('CONTRACTOR');

  const bids = await prisma.bid.findMany({
    where: { contractorId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          city: true,
          homeownerDone: true,
          contractorDone: true,
        },
      },
    },
  });

  return json({ bids });
});
