import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/guard';
import { createReviewSchema } from '@/lib/validation';
import { route, json, notFound, forbidden, conflict } from '@/lib/http';

// POST /api/reviews — a homeowner reviews the contractor who completed the job.
// Recomputes the contractor's denormalized rating average atomically.
export const POST = route(async (req: NextRequest) => {
  const user = await requireRole('HOMEOWNER');
  const data = createReviewSchema.parse(await req.json());

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    include: { bids: { where: { status: 'ACCEPTED' }, select: { contractorId: true } } },
  });
  if (!project) throw notFound('Project not found.');
  if (project.homeownerId !== user.id) throw forbidden();
  if (project.status !== 'COMPLETED') throw conflict('You can only review completed projects.');

  const contractorId = project.bids[0]?.contractorId;
  if (!contractorId) throw conflict('No contractor is associated with this project.');

  const existing = await prisma.review.findUnique({
    where: { projectId_reviewerId: { projectId: project.id, reviewerId: user.id } },
  });
  if (existing) throw conflict('You have already reviewed this project.');

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        projectId: project.id,
        reviewerId: user.id,
        revieweeId: contractorId,
        rating: data.rating,
        comment: data.comment ?? null,
      },
    });

    // Recompute the contractor's aggregate rating from all reviews.
    const agg = await tx.review.aggregate({
      where: { revieweeId: contractorId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.profile.update({
      where: { userId: contractorId },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100,
        ratingCount: agg._count.rating,
      },
    });

    return created;
  });

  return json({ review }, 201);
});
