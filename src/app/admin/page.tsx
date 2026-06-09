'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { StatusBadge } from '@/components/ProjectCard';
import { Alert, Spinner, Input } from '@/components/ui';
import { apiFetch } from '@/lib/client';

export default function AdminPage() {
  return (
    <RequireAuth roles={['ADMIN']}>
      <AdminDashboard />
    </RequireAuth>
  );
}

interface Metrics {
  users: number; homeowners: number; contractors: number; projects: number;
  openProjects: number; completedProjects: number; flaggedProjects: number; bids: number; reviews: number;
}

function AdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'users' | 'projects'>('overview');
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin console</h1>
      <div className="flex gap-1 border-b border-slate-200">
        {(['overview', 'users', 'projects'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize ${tab === t ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'users' && <Users />}
      {tab === 'projects' && <Projects />}
    </div>
  );
}

function Overview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    apiFetch<{ metrics: Metrics }>('/api/admin/metrics').then((d) => setMetrics(d.metrics)).catch((e) => setError(e.message));
  }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!metrics) return <Spinner className="text-brand-600" />;

  const cards = [
    { label: 'Total users', value: metrics.users },
    { label: 'Homeowners', value: metrics.homeowners },
    { label: 'Contractors', value: metrics.contractors },
    { label: 'Projects', value: metrics.projects },
    { label: 'Open', value: metrics.openProjects },
    { label: 'Completed', value: metrics.completedProjects },
    { label: 'Flagged', value: metrics.flaggedProjects },
    { label: 'Total bids', value: metrics.bids },
    { label: 'Reviews', value: metrics.reviews },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="card p-5">
          <p className="text-3xl font-bold text-slate-900">{c.value}</p>
          <p className="text-sm text-slate-500">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

interface AdminUser {
  id: string; email: string; role: string; isActive: boolean; emailVerified: boolean;
  profile: { name: string | null; businessName: string | null; ratingAvg: number } | null;
}

function Users() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  async function load() {
    setUsers(null);
    try {
      const d = await apiFetch<{ users: AdminUser[] }>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      setUsers(d.users);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggle(u: AdminUser) {
    await apiFetch(`/api/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: !u.isActive }) });
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
        <Input placeholder="Search by email…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-secondary">Search</button>
      </form>
      {error && <Alert>{error}</Alert>}
      {!users ? <Spinner className="text-brand-600" /> : (
        <div className="card divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{u.profile?.businessName || u.profile?.name || u.email}</p>
                <p className="text-xs text-slate-500">{u.email} · {u.role.toLowerCase()} {u.emailVerified ? '· verified' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                {!u.isActive && <span className="badge bg-red-100 text-red-700">deactivated</span>}
                <button onClick={() => toggle(u)} className={u.isActive ? 'btn-danger' : 'btn-secondary'}>
                  {u.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminProject {
  id: string; title: string; status: string; isFlagged: boolean; city: string;
  homeowner: { email: string; profile: { name: string | null } | null };
  _count: { bids: number };
}

function Projects() {
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setProjects(null);
    try {
      const d = await apiFetch<{ projects: AdminProject[] }>(`/api/admin/projects${flaggedOnly ? '?flagged=1' : ''}`);
      setProjects(d.projects);
    } catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
  }
  useEffect(() => { load(); }, [flaggedOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleFlag(p: AdminProject) {
    await apiFetch(`/api/admin/projects/${p.id}/flag`, { method: 'POST', body: JSON.stringify({ flagged: !p.isFlagged }) });
    load();
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="h-4 w-4" />
        Show flagged only
      </label>
      {error && <Alert>{error}</Alert>}
      {!projects ? <Spinner className="text-brand-600" /> : (
        <div className="card divide-y divide-slate-100">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-slate-500">{p.homeowner.profile?.name || p.homeowner.email} · 📍 {p.city} · {p._count.bids} bids</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={p.status} />
                <button onClick={() => toggleFlag(p)} className={p.isFlagged ? 'btn-secondary' : 'btn-danger'}>
                  {p.isFlagged ? 'Unflag' : 'Flag'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
