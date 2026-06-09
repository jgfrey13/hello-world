import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/guard';
import { route, json, notFound, forbidden, badRequest } from '@/lib/http';
import { saveFile, assertValidUpload, isVideo } from '@/lib/storage';

interface Params {
  params: { id: string };
}

// POST /api/projects/[id]/media — multipart upload of one or more images/videos.
// Field name: "files".
export const POST = route(async (req: NextRequest, { params }: Params) => {
  const user = await requireUser();
  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) throw notFound('Project not found.');
  if (project.homeownerId !== user.id) throw forbidden('Only the project owner can add media.');

  const form = await req.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) throw badRequest('No files provided.');
  if (files.length > 10) throw badRequest('Up to 10 files per upload.');

  const created = [];
  for (const file of files) {
    assertValidUpload(file.type, file.size);
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await saveFile(buffer, file.type);
    const media = await prisma.projectMedia.create({
      data: {
        projectId: project.id,
        fileUrl: stored.url,
        fileKey: stored.key,
        type: isVideo(file.type) ? 'VIDEO' : 'IMAGE',
      },
    });
    created.push(media);
  }

  return json({ media: created }, 201);
});
