import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/guard';
import { route, json } from '@/lib/http';

// GET /api/admin/metrics — platform-wide metrics for the admin dashboard.
export const GET = route(async () => {
  await requireRole('ADMIN');

  const [
    users,
    homeowners,
    contractors,
    projects,
    openProjects,
    completedProjects,
    flaggedProjects,
    bids,
    reviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'HOMEOWNER' } }),
    prisma.user.count({ where: { role: 'CONTRACTOR' } }),
    prisma.project.count(),
    prisma.project.count({ where: { status: 'OPEN' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.project.count({ where: { isFlagged: true } }),
    prisma.bid.count(),
    prisma.review.count(),
  ]);

  return json({
    metrics: {
      users,
      homeowners,
      contractors,
      projects,
      openProjects,
      completedProjects,
      flaggedProjects,
      bids,
      reviews,
    },
  });
});
