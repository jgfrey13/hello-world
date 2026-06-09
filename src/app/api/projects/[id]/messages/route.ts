import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/guard';
import { createMessageSchema } from '@/lib/validation';
import { route, json, notFound, forbidden, badRequest } from '@/lib/http';
import { emitNewMessage } from '@/lib/realtime';

interface Params {
  params: { id: string };
}

// Resolves the two participants of a conversation thread and authorizes the
// current user. A thread = (project, contractor); the homeowner is the project
// owner. Messaging only exists once the contractor has placed a bid.
async function resolveThread(userId: string, projectId: string, contractorIdParam: string | null) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, homeownerId: true },
  });
  if (!project) throw notFound('Project not found.');

  const isOwner = project.homeownerId === userId;

  // The contractor is either the current user (contractor viewing) or the one
  // the homeowner selected via ?contractorId=.
  const contractorId = isOwner ? contractorIdParam : userId;
  if (!contractorId) throw badRequest('contractorId is required.');
  if (!isOwner && contractorId !== userId) throw forbidden();

  const bid = await prisma.bid.findUnique({
    where: { projectId_contractorId: { projectId, contractorId } },
    select: { id: true },
  });
  if (!bid) throw forbidden('Messaging opens after a bid is placed on this project.');

  return { projectId, homeownerId: project.homeownerId, contractorId, isOwner };
}

// GET /api/projects/[id]/messages?contractorId=...
export const GET = route(async (req: NextRequest, { params }: Params) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const thread = await resolveThread(user.id, params.id, url.searchParams.get('contractorId'));

  const messages = await prisma.message.findMany({
    where: {
      projectId: thread.projectId,
      OR: [
        { senderId: thread.homeownerId, receiverId: thread.contractorId },
        { senderId: thread.contractorId, receiverId: thread.homeownerId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  });

  // Mark messages addressed to the current user as read.
  await prisma.message.updateMany({
    where: { projectId: thread.projectId, receiverId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return json({ messages, thread: { contractorId: thread.contractorId } });
});

// POST /api/projects/[id]/messages?contractorId=...
export const POST = route(async (req: NextRequest, { params }: Params) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const thread = await resolveThread(user.id, params.id, url.searchParams.get('contractorId'));

  const data = createMessageSchema.parse(await req.json());
  const receiverId = user.id === thread.homeownerId ? thread.contractorId : thread.homeownerId;

  const message = await prisma.message.create({
    data: {
      projectId: thread.projectId,
      senderId: user.id,
      receiverId,
      body: data.body,
      attachmentUrl: data.attachmentUrl ?? null,
    },
  });

  // Push to the realtime room so the other participant sees it instantly.
  emitNewMessage(thread.projectId, thread.contractorId, message);

  return json({ message }, 201);
});
