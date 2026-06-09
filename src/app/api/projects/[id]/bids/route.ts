import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/guard';
import { createBidSchema } from '@/lib/validation';
import { route, json, notFound, forbidden, conflict } from '@/lib/http';

interface Params {
  params: { id: string };
}

// POST /api/projects/[id]/bids — a contractor submits a bid on an open project.
// Submitting a bid is what unlocks the in-app messaging channel for that pair.
export const POST = route(async (req: NextRequest, { params }: Params) => {
  const user = await requireRole('CONTRACTOR');
  if (!user.emailVerified) throw forbidden('Verify your email before bidding.');

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) throw notFound('Project not found.');
  if (project.status !== 'OPEN') throw conflict('This project is no longer accepting bids.');

  const existing = await prisma.bid.findUnique({
    where: { projectId_contractorId: { projectId: project.id, contractorId: user.id } },
  });
  if (existing) throw conflict('You have already bid on this project.');

  const data = createBidSchema.parse(await req.json());

  const bid = await prisma.bid.create({
    data: {
      projectId: project.id,
      contractorId: user.id,
      amount: Math.round(data.amount),
      startDate: data.startDate,
      completionDate: data.completionDate,
      proposalText: data.proposalText,
    },
  });

  return json({ bid }, 201);
});
