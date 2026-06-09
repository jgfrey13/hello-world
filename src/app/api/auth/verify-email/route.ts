import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashOpaqueToken } from '@/lib/auth';
import { verifyEmailSchema } from '@/lib/validation';
import { route, json, badRequest } from '@/lib/http';

export const POST = route(async (req: NextRequest) => {
  const { token } = verifyEmailSchema.parse(await req.json());
  const tokenHash = hashOpaqueToken(token);

  const record = await prisma.token.findUnique({ where: { tokenHash } });
  if (!record || record.type !== 'EMAIL_VERIFY' || record.usedAt || record.expiresAt < new Date()) {
    throw badRequest('This verification link is invalid or has expired.');
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    prisma.token.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return json({ message: 'Email verified. You can now sign in.' });
});
