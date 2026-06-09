import { getSessionUser } from '@/lib/auth';
import { route, json } from '@/lib/http';

export const GET = route(async () => {
  const user = await getSessionUser();
  return json({ user });
});
