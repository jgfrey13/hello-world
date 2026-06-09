import { NextRequest } from 'next/server';
import { requireUser } from '@/lib/guard';
import { route, json, badRequest } from '@/lib/http';
import { saveFile, assertValidUpload } from '@/lib/storage';

// POST /api/uploads — single-file upload used for chat attachments. Field: "file".
// Returns a public URL the client can attach to a message.
export const POST = route(async (req: NextRequest) => {
  await requireUser();
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw badRequest('No file provided.');

  assertValidUpload(file.type, file.size);
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await saveFile(buffer, file.type);

  return json({ url: stored.url, key: stored.key }, 201);
});
