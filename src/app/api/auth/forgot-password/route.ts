import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOpaqueToken } from '@/lib/auth';
import { forgotPasswordSchema } from '@/lib/validation';
import { route, json } from '@/lib/http';
import { sendPasswordResetEmail } from '@/lib/mailer';

export const POST = route(async (req: NextRequest) => {
  const { email } = forgotPasswordSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });

  // Only act if the user exists, but always return the same response so the
  // endpoint can't be used to enumerate registered emails.
  if (user) {
    const { raw, hash } = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await prisma.token.create({
      data: { userId: user.id, tokenHash: hash, type: 'PASSWORD_RESET', expiresAt },
    });
    await sendPasswordResetEmail(email, raw);
  }

  return json({ message: 'If an account exists for that email, a reset link has been sent.' });
});
