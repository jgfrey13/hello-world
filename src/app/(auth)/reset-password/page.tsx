'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch, ApiClientError } from '@/lib/client';
import { Field, Input, Alert } from '@/components/ui';

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md py-10">
        <Alert>This reset link is missing its token. Request a new one.</Alert>
        <Link href="/forgot-password" className="btn-secondary mt-4">Request reset link</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      {done ? (
        <div className="mt-6 space-y-4">
          <Alert kind="success">Your password has been updated.</Alert>
          <Link href="/login" className="btn-primary">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="New password" hint="At least 8 characters.">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
