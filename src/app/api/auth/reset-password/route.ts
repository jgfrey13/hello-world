import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashOpaqueToken, hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validation';
import { route, json, badRequest } from '@/lib/http';

export const POST = route(async (req: NextRequest) => {
  const { token, password } = resetPasswordSchema.parse(await req.json());
  const tokenHash = hashOpaqueToken(token);

  const record = await prisma.token.findUnique({ where: { tokenHash } });
  if (
    !record ||
    record.type !== 'PASSWORD_RESET' ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    throw badRequest('This reset link is invalid or has expired.');
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.token.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate any other outstanding reset tokens for this user.
    prisma.token.updateMany({
      where: { userId: record.userId, type: 'PASSWORD_RESET', usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);

  return json({ message: 'Password updated. You can now sign in.' });
});
