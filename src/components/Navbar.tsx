'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from './AuthProvider';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    router.push('/');
    router.refresh();
  }

  const links: { href: string; label: string }[] = [];
  if (user) {
    links.push({ href: '/dashboard', label: 'Dashboard' });
    if (user.role === 'CONTRACTOR') links.push({ href: '/projects', label: 'Find Work' });
    if (user.role === 'HOMEOWNER') links.push({ href: '/projects/new', label: 'Post a Project' });
    if (user.role !== 'ADMIN') links.push({ href: '/messages', label: 'Messages' });
    if (user.role === 'ADMIN') links.push({ href: '/admin', label: 'Admin' });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <span className="text-2xl">🏠</span> HomePro
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
              {l.label}
            </Link>
          ))}
          {!loading && !user && (
            <>
              <Link href="/login" className="btn-secondary">Sign in</Link>
              <Link href="/register" className="btn-primary">Get started</Link>
            </>
          )}
          {user && (
            <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
              <Link href="/profile" className="text-sm font-medium text-slate-700 hover:text-brand-700">
                {user.name || user.email}
              </Link>
              <button onClick={handleLogout} className="btn-secondary">Sign out</button>
            </div>
          )}
        </nav>

        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              {l.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-slate-100 pt-2">
            {!user ? (
              <div className="flex gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1">Sign in</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="btn-primary flex-1">Get started</Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Link href="/profile" onClick={() => setOpen(false)} className="text-sm font-medium">{user.name || user.email}</Link>
                <button onClick={handleLogout} className="btn-secondary">Sign out</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
