import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/guard';
import { route, json, notFound, forbidden, conflict } from '@/lib/http';

interface Params {
  params: { id: string };
}

// POST /api/bids/[id]/accept — homeowner accepts a bid. This atomically:
//  - marks the bid ACCEPTED and all other bids REJECTED,
//  - moves the project to IN_PROGRESS and records the accepted bid,
//  effectively closing the project to further bidding.
export const POST = route(async (_req: NextRequest, { params }: Params) => {
  const user = await requireUser();

  const bid = await prisma.bid.findUnique({
    where: { id: params.id },
    include: { project: true },
  });
  if (!bid) throw notFound('Bid not found.');
  if (bid.project.homeownerId !== user.id) throw forbidden();
  if (bid.project.status !== 'OPEN') throw conflict('This project is no longer open.');

  await prisma.$transaction([
    prisma.bid.update({ where: { id: bid.id }, data: { status: 'ACCEPTED' } }),
    prisma.bid.updateMany({
      where: { projectId: bid.projectId, id: { not: bid.id } },
      data: { status: 'REJECTED' },
    }),
    prisma.project.update({
      where: { id: bid.projectId },
      data: { status: 'IN_PROGRESS', acceptedBidId: bid.id },
    }),
  ]);

  return json({ message: 'Bid accepted. The project is now in progress.' });
});
