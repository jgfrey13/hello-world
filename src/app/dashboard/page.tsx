'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { RequireAuth } from '@/components/RequireAuth';
import { ProjectCard, ProjectCardData, StatusBadge } from '@/components/ProjectCard';
import { Alert, Spinner } from '@/components/ui';
import { apiFetch, CATEGORY_LABELS } from '@/lib/client';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'ADMIN') return <AdminRedirect />;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user.name || 'there'} 👋</h1>
          <p className="text-sm text-slate-600">
            {user.role === 'HOMEOWNER' ? 'Manage your projects and bids.' : 'Track your bids and active jobs.'}
          </p>
        </div>
        {user.role === 'HOMEOWNER' ? (
          <Link href="/projects/new" className="btn-primary">+ Post a project</Link>
        ) : (
          <Link href="/projects" className="btn-primary">Find work</Link>
        )}
      </div>

      {!user.emailVerified && (
        <Alert kind="info">
          Your email isn’t verified yet. Some actions (like bidding) require verification. Check
          your inbox for the verification link.
        </Alert>
      )}

      {user.role === 'HOMEOWNER' ? <HomeownerDashboard /> : <ContractorDashboard />}
    </div>
  );
}

function AdminRedirect() {
  useEffect(() => {
    window.location.href = '/admin';
  }, []);
  return null;
}

function HomeownerDashboard() {
  const [projects, setProjects] = useState<ProjectCardData[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ projects: ProjectCardData[] }>('/api/projects?mine=1')
      .then((d) => setProjects(d.projects))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!projects) return <Spinner className="text-brand-600" />;

  const active = projects.filter((p) => ['OPEN', 'IN_PROGRESS'].includes(p.status));
  const past = projects.filter((p) => ['COMPLETED', 'CANCELLED', 'FLAGGED'].includes(p.status));

  return (
    <div className="space-y-8">
      <Section title={`Active listings (${active.length})`}>
        {active.length === 0 ? (
          <EmptyState
            message="You don’t have any active projects yet."
            cta={{ href: '/projects/new', label: 'Post your first project' }}
          />
        ) : (
          <Grid>{active.map((p) => <ProjectCard key={p.id} project={p} />)}</Grid>
        )}
      </Section>

      {past.length > 0 && (
        <Section title={`History (${past.length})`}>
          <Grid>{past.map((p) => <ProjectCard key={p.id} project={p} />)}</Grid>
        </Section>
      )}
    </div>
  );
}

interface MyBid {
  id: string;
  amount: number;
  status: string;
  project: { id: string; title: string; category: string; status: string; city: string };
}

function ContractorDashboard() {
  const [bids, setBids] = useState<MyBid[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ bids: MyBid[] }>('/api/bids/mine')
      .then((d) => setBids(d.bids))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!bids) return <Spinner className="text-brand-600" />;

  const active = bids.filter((b) => b.status === 'ACCEPTED' && b.project.status === 'IN_PROGRESS');
  const pending = bids.filter((b) => b.status === 'PENDING');
  const past = bids.filter((b) => ['REJECTED', 'WITHDRAWN'].includes(b.status) || b.project.status === 'COMPLETED');

  return (
    <div className="space-y-8">
      <Section title={`Active jobs (${active.length})`}>
        {active.length === 0 ? (
          <p className="text-sm text-slate-500">No active jobs. Win a bid to get started.</p>
        ) : (
          <BidTable bids={active} />
        )}
      </Section>
      <Section title={`Pending bids (${pending.length})`}>
        {pending.length === 0 ? (
          <EmptyState message="You haven’t placed any bids yet." cta={{ href: '/projects', label: 'Browse the job board' }} />
        ) : (
          <BidTable bids={pending} />
        )}
      </Section>
      {past.length > 0 && (
        <Section title="History">
          <BidTable bids={past} />
        </Section>
      )}
    </div>
  );
}

function BidTable({ bids }: { bids: MyBid[] }) {
  return (
    <div className="card divide-y divide-slate-100">
      {bids.map((b) => (
        <Link key={b.id} href={`/projects/${b.project.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
          <div>
            <p className="font-medium text-slate-900">{b.project.title}</p>
            <p className="text-xs text-slate-500">
              {CATEGORY_LABELS[b.project.category]} · 📍 {b.project.city}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">${b.amount.toLocaleString()}</span>
            <StatusBadge status={b.status} />
          </div>
        </Link>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function EmptyState({ message, cta }: { message: string; cta?: { href: string; label: string } }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <p className="text-slate-600">{message}</p>
      {cta && <Link href={cta.href} className="btn-primary">{cta.label}</Link>}
    </div>
  );
}
