import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/guard';
import { route, json } from '@/lib/http';

// GET /api/messages/threads — the current user's conversation threads.
// A thread exists for every bid: homeowners get one per bidder on their
// projects; contractors get one per project they've bid on.
export const GET = route(async () => {
  const user = await requireUser();

  const bids = await prisma.bid.findMany({
    where:
      user.role === 'CONTRACTOR'
        ? { contractorId: user.id }
        : { project: { homeownerId: user.id } },
    orderBy: { updatedAt: 'desc' },
    select: {
      projectId: true,
      contractorId: true,
      project: { select: { id: true, title: true, status: true } },
      contractor: { select: { id: true, profile: { select: { name: true, businessName: true } } } },
    },
  });

  const threads = await Promise.all(
    bids.map(async (b) => {
      const [last, unread] = await Promise.all([
        prisma.message.findFirst({
          where: {
            projectId: b.projectId,
            OR: [{ senderId: b.contractorId }, { receiverId: b.contractorId }],
          },
          orderBy: { createdAt: 'desc' },
          select: { body: true, createdAt: true },
        }),
        prisma.message.count({
          where: { projectId: b.projectId, receiverId: user.id, readAt: null },
        }),
      ]);
      return {
        projectId: b.projectId,
        contractorId: b.contractorId,
        projectTitle: b.project.title,
        projectStatus: b.project.status,
        counterpartyName:
          user.role === 'CONTRACTOR'
            ? b.project.title
            : b.contractor.profile?.businessName || b.contractor.profile?.name || 'Contractor',
        lastMessage: last?.body ?? null,
        lastAt: last?.createdAt ?? null,
        unread,
      };
    }),
  );

  return json({ threads });
});
