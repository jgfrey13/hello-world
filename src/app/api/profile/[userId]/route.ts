import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { route, json, notFound } from '@/lib/http';

interface Params {
  params: { userId: string };
}

// GET /api/profile/[userId] — public contractor profile, including recent reviews.
export const GET = route(async (_req: NextRequest, { params }: Params) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: params.userId },
    select: {
      name: true,
      businessName: true,
      bio: true,
      city: true,
      categories: true,
      serviceRadiusMiles: true,
      ratingAvg: true,
      ratingCount: true,
    },
  });
  if (!profile) throw notFound('Profile not found.');

  const reviews = await prisma.review.findMany({
    where: { revieweeId: params.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { rating: true, comment: true, createdAt: true },
  });

  return json({ profile, reviews });
});
