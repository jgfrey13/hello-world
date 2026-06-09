import type { Role } from '@prisma/client';
import { getSessionUser, SessionUser } from './auth';
import { unauthorized, forbidden } from './http';

// Requires an authenticated user. Throws 401 otherwise.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized('You must be signed in.');
  return user;
}

// Requires an authenticated user with one of the allowed roles.
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw forbidden('You do not have permission to perform this action.');
  }
  return user;
}
