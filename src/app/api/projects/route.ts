import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole, requireUser } from '@/lib/guard';
import { createProjectSchema, projectFilterSchema } from '@/lib/validation';
import { route, json } from '@/lib/http';

const PAGE_SIZE = 12;

// GET /api/projects — searchable, filterable job board (for contractors) or the
// homeowner's own listings (when ?mine=1).
export const GET = route(async (req: NextRequest) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const mine = url.searchParams.get('mine') === '1';

  const filters = projectFilterSchema.parse(Object.fromEntries(url.searchParams));

  const where: Prisma.ProjectWhereInput = {};

  if (mine) {
    where.homeownerId = user.id;
  } else {
    // Public job board only shows open, non-flagged projects.
    where.status = filters.status ?? 'OPEN';
    where.isFlagged = false;
  }

  if (filters.category) where.category = filters.category;
  if (filters.zip) where.zip = filters.zip;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
      { city: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
    where.AND = [
      ...(filters.budgetMax !== undefined
        ? [{ OR: [{ budgetMin: { lte: filters.budgetMax } }, { requestQuotes: true }] }]
        : []),
      ...(filters.budgetMin !== undefined
        ? [{ OR: [{ budgetMax: { gte: filters.budgetMin } }, { requestQuotes: true }] }]
        : []),
    ];
  }

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        media: { take: 1 },
        homeowner: { select: { profile: { select: { name: true, city: true } } } },
        _count: { select: { bids: true } },
      },
    }),
  ]);

  return json({
    projects,
    pagination: { page: filters.page, pageSize: PAGE_SIZE, total, pages: Math.ceil(total / PAGE_SIZE) },
  });
});

// POST /api/projects — create a project (homeowners only).
export const POST = route(async (req: NextRequest) => {
  const user = await requireRole('HOMEOWNER');
  const data = createProjectSchema.parse(await req.json());

  const project = await prisma.project.create({
    data: {
      homeownerId: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      urgency: data.urgency,
      requestQuotes: data.requestQuotes,
      budgetMin: data.requestQuotes ? null : data.budgetMin ?? null,
      budgetMax: data.requestQuotes ? null : data.budgetMax ?? null,
      city: data.city,
      zip: data.zip.slice(0, 5),
    },
  });

  return json({ project }, 201);
});
