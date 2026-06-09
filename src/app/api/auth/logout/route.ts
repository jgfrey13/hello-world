import { clearAuthCookie } from '@/lib/auth';
import { route, json } from '@/lib/http';

export const POST = route(async () => {
  clearAuthCookie();
  return json({ message: 'Signed out.' });
});
