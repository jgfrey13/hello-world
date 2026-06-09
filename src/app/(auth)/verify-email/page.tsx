'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, ApiClientError } from '@/lib/client';
import { Alert, Spinner } from '@/components/ui';

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    apiFetch('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => {
        setState('ok');
        setMessage('Your email is verified.');
      })
      .catch((err) => {
        setState('error');
        setMessage(err instanceof ApiClientError ? err.message : 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <Spinner className="text-brand-600" />
          <p className="text-slate-600">Verifying your email…</p>
        </div>
      )}
      {state === 'ok' && (
        <div className="space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold">{message}</h1>
          <Link href="/login" className="btn-primary">Sign in</Link>
        </div>
      )}
      {state === 'error' && (
        <div className="space-y-4">
          <Alert>{message}</Alert>
          <Link href="/login" className="btn-secondary">Back to sign in</Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
