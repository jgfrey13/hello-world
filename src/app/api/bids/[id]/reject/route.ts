import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/guard';
import { route, json, notFound, forbidden, conflict } from '@/lib/http';

interface Params {
  params: { id: string };
}

// POST /api/bids/[id]/reject — homeowner rejects a single pending bid.
export const POST = route(async (_req: NextRequest, { params }: Params) => {
  const user = await requireUser();

  const bid = await prisma.bid.findUnique({ where: { id: params.id }, include: { project: true } });
  if (!bid) throw notFound('Bid not found.');
  if (bid.project.homeownerId !== user.id) throw forbidden();
  if (bid.status !== 'PENDING') throw conflict('Only pending bids can be rejected.');

  await prisma.bid.update({ where: { id: bid.id }, data: { status: 'REJECTED' } });
  return json({ message: 'Bid rejected.' });
});
