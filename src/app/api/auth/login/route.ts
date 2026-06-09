import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { route, json, unauthorized, forbidden } from '@/lib/http';

export const POST = route(async (req: NextRequest) => {
  const data = loginSchema.parse(await req.json());

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { profile: { select: { name: true } } },
  });

  // Use a constant-ish error to avoid leaking which accounts exist.
  if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
    throw unauthorized('Invalid email or password.');
  }
  if (!user.isActive) throw forbidden('This account has been deactivated.');

  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  setAuthCookie(token);

  return json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      name: user.profile?.name ?? null,
    },
  });
});
