import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/guard';
import { route, json, notFound, forbidden } from '@/lib/http';

interface Params {
  params: { id: string };
}

// GET /api/projects/[id] — full project detail.
// The homeowner (and admins) see all bids; a contractor sees only their own bid.
export const GET = route(async (_req: NextRequest, { params }: Params) => {
  const user = await requireUser();

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      media: true,
      homeowner: {
        select: { id: true, profile: { select: { name: true, city: true } } },
      },
      reviews: true,
    },
  });
  if (!project) throw notFound('Project not found.');

  const isOwner = project.homeownerId === user.id;
  const isAdmin = user.role === 'ADMIN';

  const bids = await prisma.bid.findMany({
    where: {
      projectId: project.id,
      ...(isOwner || isAdmin ? {} : { contractorId: user.id }),
    },
    orderBy: { createdAt: 'asc' },
    include: {
      contractor: {
        select: {
          id: true,
          profile: {
            select: {
              name: true,
              businessName: true,
              ratingAvg: true,
              ratingCount: true,
              city: true,
            },
          },
        },
      },
    },
  });

  return json({ project, bids, viewer: { isOwner, isAdmin } });
});

// PATCH /api/projects/[id] — homeowner edits an open project.
export const PATCH = route(async (req: NextRequest, { params }: Params) => {
  const user = await requireUser();
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) throw notFound('Project not found.');
  if (project.homeownerId !== user.id) throw forbidden();
  if (project.status !== 'OPEN') throw forbidden('Only open projects can be edited.');

  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  for (const key of ['title', 'description', 'urgency'] as const) {
    if (typeof body[key] === 'string') allowed[key] = body[key];
  }

  const updated = await prisma.project.update({ where: { id: project.id }, data: allowed });
  return json({ project: updated });
});

// DELETE /api/projects/[id] — homeowner cancels a project.
export const DELETE = route(async (_req: NextRequest, { params }: Params) => {
  const user = await requireUser();
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) throw notFound('Project not found.');
  if (project.homeownerId !== user.id && user.role !== 'ADMIN') throw forbidden();

  await prisma.project.update({ where: { id: project.id }, data: { status: 'CANCELLED' } });
  return json({ message: 'Project cancelled.' });
});
