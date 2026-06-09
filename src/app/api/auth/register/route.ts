import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateOpaqueToken } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { route, json, conflict } from '@/lib/http';
import { sendVerificationEmail } from '@/lib/mailer';

export const POST = route(async (req: NextRequest) => {
  const data = registerSchema.parse(await req.json());

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw conflict('An account with this email already exists.');

  const passwordHash = await hashPassword(data.password);

  // Create the user, their profile, and an email-verification token atomically.
  const { raw, hash } = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: data.role,
      profile: {
        create: {
          name: data.name,
          businessName: data.role === 'CONTRACTOR' ? data.businessName ?? null : null,
          licenseNum: data.role === 'CONTRACTOR' ? data.licenseNum ?? null : null,
          serviceRadiusMiles:
            data.role === 'CONTRACTOR' ? data.serviceRadiusMiles ?? null : null,
          city: data.city ?? null,
          zip: data.zip ?? null,
        },
      },
      tokens: {
        create: { tokenHash: hash, type: 'EMAIL_VERIFY', expiresAt },
      },
    },
    select: { id: true, email: true, role: true },
  });

  await sendVerificationEmail(user.email, raw);

  return json(
    {
      user,
      message: 'Account created. Check your email to verify your address.',
    },
    201,
  );
});
