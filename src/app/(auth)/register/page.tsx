'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, ApiClientError } from '@/lib/client';
import { Field, Input, Select, Alert } from '@/components/ui';

type Role = 'HOMEOWNER' | 'CONTRACTOR';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get('role') === 'CONTRACTOR' ? 'CONTRACTOR' : 'HOMEOWNER') as Role;

  const [role, setRole] = useState<Role>(initialRole);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    businessName: '',
    licenseNum: '',
    serviceRadiusMiles: '',
    city: '',
    zip: '',
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        email: form.email,
        password: form.password,
        role,
        name: form.name,
        city: form.city || undefined,
        zip: form.zip || undefined,
      };
      if (role === 'CONTRACTOR') {
        payload.businessName = form.businessName || undefined;
        payload.licenseNum = form.licenseNum || undefined;
        payload.serviceRadiusMiles = form.serviceRadiusMiles
          ? Number(form.serviceRadiusMiles)
          : undefined;
      }
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-8 text-center">
        <div className="text-5xl">📬</div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-slate-600">
          We sent a verification link to <strong>{form.email}</strong>. Verify your address, then
          sign in.
        </p>
        <p className="text-xs text-slate-500">
          (Local dev: the link is printed in the server console.)
        </p>
        <Link href="/login" className="btn-primary">Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">Join as a homeowner or a contractor.</p>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
        {(['HOMEOWNER', 'CONTRACTOR'] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
              role === r ? 'bg-white text-brand-700 shadow' : 'text-slate-600'
            }`}
          >
            {r === 'HOMEOWNER' ? 'Homeowner' : 'Contractor'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Full name">
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
        </Field>

        {role === 'CONTRACTOR' && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Contractor details</p>
            <Field label="Business name">
              <Input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
            </Field>
            <Field label="License number">
              <Input value={form.licenseNum} onChange={(e) => set('licenseNum', e.target.value)} />
            </Field>
            <Field label="Service radius (miles)">
              <Input type="number" min={1} max={500} value={form.serviceRadiusMiles} onChange={(e) => set('serviceRadiusMiles', e.target.value)} />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="ZIP code">
            <Input value={form.zip} onChange={(e) => set('zip', e.target.value)} />
          </Field>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-brand-700">Sign in</Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
