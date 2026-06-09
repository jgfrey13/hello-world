import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/guard';
import { route, json, badRequest } from '@/lib/http';

interface Params {
  params: { id: string };
}

// PATCH /api/admin/users/[id] — activate/deactivate a user (admin only).
export const PATCH = route(async (req: NextRequest, { params }: Params) => {
  const admin = await requireRole('ADMIN');
  const body = await req.json();

  if (params.id === admin.id) throw badRequest('You cannot modify your own account here.');
  if (typeof body.isActive !== 'boolean') throw badRequest('isActive (boolean) is required.');

  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isActive: body.isActive },
    select: { id: true, isActive: true },
  });

  return json({ user });
});
