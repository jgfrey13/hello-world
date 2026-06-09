'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Spinner } from './ui';

// Client-side guard for protected pages. Redirects unauthenticated users to
// /login and, when `roles` is provided, blocks users without an allowed role.
export function RequireAuth({
  roles,
  children,
}: {
  roles?: Array<'HOMEOWNER' | 'CONTRACTOR' | 'ADMIN'>;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (roles && !roles.includes(user.role)) router.replace('/dashboard');
  }, [user, loading, roles, router]);

  if (loading || !user || (roles && !roles.includes(user.role))) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="text-brand-600" />
      </div>
    );
  }
  return <>{children}</>;
}
