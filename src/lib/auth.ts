import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import type { Role } from '@prisma/client';
import { env } from './env';
import { prisma } from './prisma';

export const AUTH_COOKIE = 'him_token';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
}

// --- Password hashing ---------------------------------------------------------

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- JWT ----------------------------------------------------------------------

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

// --- Opaque tokens (email verify / password reset) ---------------------------

// Returns the raw token (sent to the user) and its hash (stored in the DB).
export function generateOpaqueToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export function hashOpaqueToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// --- Cookie-based session helpers (App Router server components/routes) -------

export function setAuthCookie(token: string) {
  cookies().set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAuthCookie() {
  cookies().set(AUTH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  name: string | null;
}

// Reads the current user from the auth cookie. Returns null when unauthenticated.
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { profile: { select: { name: true } } },
  });
  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    name: user.profile?.name ?? null,
  };
}
