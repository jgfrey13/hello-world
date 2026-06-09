'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import { Field, Input, Textarea, Alert, Spinner } from '@/components/ui';
import { apiFetch, ApiClientError, CATEGORY_LABELS } from '@/lib/client';

interface ProfileData {
  name: string;
  businessName: string | null;
  licenseNum: string | null;
  bio: string | null;
  serviceRadiusMiles: number | null;
  categories: string[];
  city: string | null;
  zip: string | null;
  ratingAvg: number;
  ratingCount: number;
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileEditor />
    </RequireAuth>
  );
}

function ProfileEditor() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<{ profile: ProfileData }>('/api/profile')
      .then((d) => setProfile(d.profile))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!profile || !user) return <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>;

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
    setSaved(false);
  }

  function toggleCategory(cat: string) {
    setProfile((p) => {
      if (!p) return p;
      const has = p.categories.includes(cat);
      return { ...p, categories: has ? p.categories.filter((c) => c !== cat) : [...p.categories, cat] };
    });
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profile!.name,
          businessName: profile!.businessName ?? '',
          licenseNum: profile!.licenseNum ?? '',
          bio: profile!.bio ?? '',
          serviceRadiusMiles: profile!.serviceRadiusMiles ?? undefined,
          categories: profile!.categories,
          city: profile!.city ?? '',
          zip: profile!.zip ?? '',
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  const isContractor = user.role === 'CONTRACTOR';

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Your profile</h1>
      <p className="text-sm text-slate-600">{user.email} · {user.role.toLowerCase()}</p>

      <form onSubmit={save} className="card mt-6 space-y-5 p-6">
        {error && <Alert>{error}</Alert>}
        {saved && <Alert kind="success">Profile saved.</Alert>}

        <Field label="Full name">
          <Input value={profile.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <Input value={profile.city ?? ''} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="ZIP code">
            <Input value={profile.zip ?? ''} onChange={(e) => set('zip', e.target.value)} />
          </Field>
        </div>

        {isContractor && (
          <>
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Current rating: <strong>{profile.ratingAvg.toFixed(1)}</strong> ({profile.ratingCount} reviews)
            </div>
            <Field label="Business name">
              <Input value={profile.businessName ?? ''} onChange={(e) => set('businessName', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="License number">
                <Input value={profile.licenseNum ?? ''} onChange={(e) => set('licenseNum', e.target.value)} />
              </Field>
              <Field label="Service radius (miles)">
                <Input type="number" min={1} max={500} value={profile.serviceRadiusMiles ?? ''} onChange={(e) => set('serviceRadiusMiles', e.target.value ? Number(e.target.value) : null)} />
              </Field>
            </div>
            <Field label="Bio">
              <Textarea rows={4} value={profile.bio ?? ''} onChange={(e) => set('bio', e.target.value)} placeholder="Tell homeowners about your experience…" />
            </Field>
            <div>
              <p className="label">Service categories</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => toggleCategory(k)}
                    className={`rounded-full border px-3 py-1 text-sm ${profile.categories.includes(k) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
