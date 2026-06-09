import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/guard';
import { updateProfileSchema } from '@/lib/validation';
import { route, json, notFound } from '@/lib/http';

// GET /api/profile — the current user's full profile.
export const GET = route(async () => {
  const user = await requireUser();
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  if (!profile) throw notFound('Profile not found.');
  return json({ profile, role: user.role });
});

// PATCH /api/profile — update the current user's profile.
export const PATCH = route(async (req: NextRequest) => {
  const user = await requireUser();
  const data = updateProfileSchema.parse(await req.json());

  const profile = await prisma.profile.update({
    where: { userId: user.id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.businessName !== undefined ? { businessName: data.businessName ?? null } : {}),
      ...(data.licenseNum !== undefined ? { licenseNum: data.licenseNum ?? null } : {}),
      ...(data.bio !== undefined ? { bio: data.bio ?? null } : {}),
      ...(data.serviceRadiusMiles !== undefined
        ? { serviceRadiusMiles: data.serviceRadiusMiles }
        : {}),
      ...(data.categories !== undefined ? { categories: data.categories } : {}),
      ...(data.city !== undefined ? { city: data.city ?? null } : {}),
      ...(data.zip !== undefined ? { zip: data.zip ?? null } : {}),
    },
  });

  return json({ profile });
});
