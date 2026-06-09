import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/guard';
import { route, json } from '@/lib/http';

// GET /api/admin/users — list users (admin only).
export const GET = route(async (req: NextRequest) => {
  await requireRole('ADMIN');
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();

  const users = await prisma.user.findMany({
    where: q ? { email: { contains: q, mode: 'insensitive' } } : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      profile: { select: { name: true, businessName: true, ratingAvg: true } },
    },
  });

  return json({ users });
});
