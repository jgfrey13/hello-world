'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import { Alert, Spinner } from '@/components/ui';
import { apiFetch } from '@/lib/client';

interface Thread {
  projectId: string;
  contractorId: string;
  projectTitle: string;
  projectStatus: string;
  counterpartyName: string;
  lastMessage: string | null;
  lastAt: string | null;
  unread: number;
}

export default function MessagesPage() {
  return (
    <RequireAuth roles={['HOMEOWNER', 'CONTRACTOR']}>
      <Inbox />
    </RequireAuth>
  );
}

function Inbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ threads: Thread[] }>('/api/messages/threads')
      .then((d) => setThreads(d.threads))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!threads) return <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Messages</h1>
      {threads.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-600">
          No conversations yet. {user?.role === 'CONTRACTOR' ? 'Place a bid to start chatting.' : 'Chats open when contractors bid on your projects.'}
        </div>
      ) : (
        <div className="card mt-6 divide-y divide-slate-100">
          {threads.map((t) => (
            <Link
              key={`${t.projectId}-${t.contractorId}`}
              href={`/projects/${t.projectId}`}
              className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{t.projectTitle}</p>
                <p className="truncate text-sm text-slate-500">
                  {user?.role === 'HOMEOWNER' ? `${t.counterpartyName} · ` : ''}
                  {t.lastMessage ?? 'No messages yet'}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {t.lastAt && <span className="text-xs text-slate-400">{new Date(t.lastAt).toLocaleDateString()}</span>}
                {t.unread > 0 && <span className="badge bg-brand-600 text-white">{t.unread}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
