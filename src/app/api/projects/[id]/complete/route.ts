import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/guard';
import { route, json, notFound, forbidden, conflict } from '@/lib/http';

interface Params {
  params: { id: string };
}

// POST /api/projects/[id]/complete — each party (homeowner + accepted contractor)
// confirms completion. Once both confirm, the project becomes COMPLETED, which
// unlocks the review flow.
export const POST = route(async (_req: NextRequest, { params }: Params) => {
  const user = await requireUser();

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { bids: { where: { status: 'ACCEPTED' }, select: { contractorId: true } } },
  });
  if (!project) throw notFound('Project not found.');
  if (project.status !== 'IN_PROGRESS') throw conflict('Project is not in progress.');

  const acceptedContractorId = project.bids[0]?.contractorId;
  const isOwner = user.id === project.homeownerId;
  const isContractor = user.id === acceptedContractorId;
  if (!isOwner && !isContractor) throw forbidden();

  const data: { homeownerDone?: boolean; contractorDone?: boolean; status?: 'COMPLETED' } = {};
  if (isOwner) data.homeownerDone = true;
  if (isContractor) data.contractorDone = true;

  const bothDone =
    (isOwner || project.homeownerDone) && (isContractor || project.contractorDone);
  if (bothDone) data.status = 'COMPLETED';

  const updated = await prisma.project.update({ where: { id: project.id }, data });
  return json({
    project: updated,
    message: bothDone
      ? 'Project completed. You can now leave a review.'
      : 'Marked complete on your side. Waiting for the other party to confirm.',
  });
});
