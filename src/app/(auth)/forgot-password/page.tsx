'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/client';
import { Field, Input, Alert } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-2xl font-bold">Reset your password</h1>
      {sent ? (
        <div className="mt-6 space-y-4">
          <Alert kind="success">
            If an account exists for <strong>{email}</strong>, we’ve sent a reset link. (Local dev:
            check the server console.)
          </Alert>
          <Link href="/login" className="btn-secondary">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">
            Enter your email and we’ll send you a link to reset your password.
          </p>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </div>
  );
}
