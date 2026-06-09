'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import { StatusBadge } from '@/components/ProjectCard';
import { Chat } from '@/components/Chat';
import { RatingDisplay, RatingInput } from '@/components/StarRating';
import { Alert, Spinner, Textarea, Field, Input } from '@/components/ui';
import { apiFetch, ApiClientError, CATEGORY_LABELS, URGENCY_LABELS, formatBudget } from '@/lib/client';

interface Media { id: string; fileUrl: string; type: string }
interface BidContractor {
  id: string;
  profile: { name: string; businessName: string | null; ratingAvg: number; ratingCount: number; city: string | null } | null;
}
interface Bid {
  id: string;
  contractorId: string;
  amount: number;
  startDate: string;
  completionDate: string;
  proposalText: string;
  status: string;
  contractor: BidContractor;
}
interface Project {
  id: string;
  homeownerId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  requestQuotes: boolean;
  city: string;
  zip: string;
  homeownerDone: boolean;
  contractorDone: boolean;
  acceptedBidId: string | null;
  createdAt: string;
  media: Media[];
  homeowner: { id: string; profile: { name: string; city: string | null } | null };
  reviews: { reviewerId: string; rating: number; comment: string | null }[];
}
interface DetailResponse {
  project: Project;
  bids: Bid[];
  viewer: { isOwner: boolean; isAdmin: boolean };
}

export default function ProjectDetailPage() {
  return (
    <RequireAuth>
      <ProjectDetail />
    </RequireAuth>
  );
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<DetailResponse>(`/api/projects/${id}`);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project.');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (error) return <Alert>{error}</Alert>;
  if (!data || !user) return <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>;

  const { project, bids, viewer } = data;
  const isOwner = viewer.isOwner;
  const myBid = !isOwner ? bids.find((b) => b.contractorId === user.id) : undefined;
  const acceptedBid = bids.find((b) => b.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-brand-700">&larr; Back to dashboard</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden">
            {project.media.length > 0 && <MediaGallery media={project.media} />}
            <div className="space-y-4 p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-brand-50 text-brand-700">{CATEGORY_LABELS[project.category]}</span>
                <StatusBadge status={project.status} />
                <span className="badge bg-slate-100 text-slate-600">⏱ {URGENCY_LABELS[project.urgency]}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {formatBudget(project.budgetMin, project.budgetMax, project.requestQuotes)}
                </span>
                <span>📍 {project.city}, {project.zip}</span>
                <span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-slate-700">{project.description}</p>
            </div>
          </div>

          {/* Homeowner: bid comparison */}
          {isOwner && (
            <BidComparison bids={bids} project={project} onChange={load} />
          )}

          {/* Contractor: bid form or their bid */}
          {!isOwner && user.role === 'CONTRACTOR' && (
            <ContractorBidPanel project={project} myBid={myBid} onChange={load} />
          )}

          {/* Completion + review */}
          {project.status !== 'OPEN' && (
            <CompletionPanel project={project} isOwner={isOwner} acceptedBid={acceptedBid} userId={user.id} onChange={load} />
          )}
        </div>

        {/* Sidebar: chat */}
        <div className="space-y-6">
          {isOwner ? (
            <OwnerChatPanel project={project} bids={bids} />
          ) : myBid ? (
            <div className="card overflow-hidden">
              <Chat
                projectId={project.id}
                contractorId={user.id}
                counterpartyName={project.homeowner.profile?.name || 'Homeowner'}
              />
            </div>
          ) : (
            <div className="card p-6 text-center text-sm text-slate-500">
              💬 Submit a bid to open a private chat with the homeowner.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MediaGallery({ media }: { media: Media[] }) {
  const [active, setActive] = useState(0);
  const current = media[active];
  return (
    <div>
      <div className="aspect-[16/9] w-full bg-slate-900">
        {current.type === 'VIDEO' ? (
          <video src={current.fileUrl} controls className="h-full w-full object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.fileUrl} alt="" className="h-full w-full object-contain" />
        )}
      </div>
      {media.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {media.map((m, i) => (
            <button key={m.id} onClick={() => setActive(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? 'border-brand-500' : 'border-transparent'}`}>
              {m.type === 'VIDEO' ? (
                <div className="flex h-full items-center justify-center bg-slate-800 text-white">🎬</div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.fileUrl} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BidComparison({ bids, project, onChange }: { bids: Bid[]; project: Project; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function act(bidId: string, action: 'accept' | 'reject') {
    setBusy(bidId + action);
    setError('');
    try {
      await apiFetch(`/api/bids/${bidId}/${action}`, { method: 'POST' });
      onChange();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Action failed.');
    } finally {
      setBusy(null);
    }
  }

  const pending = bids.filter((b) => b.status !== 'REJECTED');

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Bids ({bids.length})</h2>
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
      {bids.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No bids yet. Contractors will appear here as they respond.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {pending.map((b) => (
            <div key={b.id} className={`rounded-xl border p-4 ${b.status === 'ACCEPTED' ? 'border-green-300 bg-green-50' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/contractors/${b.contractorId}`} className="font-semibold text-slate-900 hover:text-brand-700">
                    {b.contractor.profile?.businessName || b.contractor.profile?.name || 'Contractor'}
                  </Link>
                  <div className="mt-1"><RatingDisplay value={b.contractor.profile?.ratingAvg ?? 0} count={b.contractor.profile?.ratingCount} /></div>
                </div>
                <span className="text-xl font-bold text-slate-900">${b.amount.toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {new Date(b.startDate).toLocaleDateString()} → {new Date(b.completionDate).toLocaleDateString()}
              </p>
              <p className="mt-2 line-clamp-4 text-sm text-slate-700">{b.proposalText}</p>
              {project.status === 'OPEN' ? (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => act(b.id, 'accept')} disabled={!!busy} className="btn-primary flex-1">
                    {busy === b.id + 'accept' ? '…' : 'Accept'}
                  </button>
                  <button onClick={() => act(b.id, 'reject')} disabled={!!busy} className="btn-secondary">Reject</button>
                </div>
              ) : b.status === 'ACCEPTED' ? (
                <p className="mt-4 text-sm font-semibold text-green-700">✓ Accepted</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContractorBidPanel({ project, myBid, onChange }: { project: Project; myBid?: Bid; onChange: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ amount: '', startDate: '', completionDate: '', proposalText: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (myBid) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold">Your bid</h2>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-2xl font-bold">${myBid.amount.toLocaleString()}</span>
          <StatusBadge status={myBid.status} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          {new Date(myBid.startDate).toLocaleDateString()} → {new Date(myBid.completionDate).toLocaleDateString()}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{myBid.proposalText}</p>
      </div>
    );
  }

  if (project.status !== 'OPEN') {
    return <div className="card p-6 text-sm text-slate-500">This project is no longer accepting bids.</div>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch(`/api/projects/${project.id}/bids`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(form.amount),
          startDate: form.startDate,
          completionDate: form.completionDate,
          proposalText: form.proposalText,
        }),
      });
      onChange();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to submit bid.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Submit a bid</h2>
      {!user?.emailVerified && <Alert kind="info">Verify your email before bidding.</Alert>}
      {error && <Alert>{error}</Alert>}
      <Field label="Bid amount ($)">
        <Input type="number" min={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimated start">
          <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} required />
        </Field>
        <Field label="Estimated completion">
          <Input type="date" value={form.completionDate} onChange={(e) => setForm((f) => ({ ...f, completionDate: e.target.value }))} required />
        </Field>
      </div>
      <Field label="Your proposal">
        <Textarea rows={4} value={form.proposalText} onChange={(e) => setForm((f) => ({ ...f, proposalText: e.target.value }))} placeholder="Describe your approach, materials, and why you’re a great fit…" required />
      </Field>
      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Submitting…' : 'Submit bid'}
      </button>
    </form>
  );
}

function CompletionPanel({
  project, isOwner, acceptedBid, userId, onChange,
}: { project: Project; isOwner: boolean; acceptedBid?: Bid; userId: string; onChange: () => void }) {
  const isAcceptedContractor = acceptedBid?.contractorId === userId;
  if (!isOwner && !isAcceptedContractor) return null;

  const myDone = isOwner ? project.homeownerDone : project.contractorDone;
  const alreadyReviewed = project.reviews.some((r) => r.reviewerId === userId);

  return (
    <div className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Project completion</h2>

      {project.status === 'IN_PROGRESS' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className={project.homeownerDone ? 'text-green-700' : 'text-slate-500'}>
              {project.homeownerDone ? '✓' : '○'} Homeowner confirmed
            </span>
            <span className={project.contractorDone ? 'text-green-700' : 'text-slate-500'}>
              {project.contractorDone ? '✓' : '○'} Contractor confirmed
            </span>
          </div>
          <MarkCompleteButton projectId={project.id} disabled={myDone} done={myDone} onChange={onChange} />
        </div>
      )}

      {project.status === 'COMPLETED' && (
        <>
          <Alert kind="success">This project is complete. 🎉</Alert>
          {isOwner && !alreadyReviewed && <ReviewForm projectId={project.id} onChange={onChange} />}
          {alreadyReviewed && <p className="text-sm text-slate-600">Thanks for leaving a review!</p>}
        </>
      )}
    </div>
  );
}

function MarkCompleteButton({ projectId, disabled, done, onChange }: { projectId: string; disabled: boolean; done: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  async function mark() {
    setBusy(true);
    try {
      await apiFetch(`/api/projects/${projectId}/complete`, { method: 'POST' });
      onChange();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button onClick={mark} disabled={disabled || busy} className="btn-primary">
      {done ? 'You’ve confirmed completion' : busy ? '…' : 'Mark as complete'}
    </button>
  );
}

function ReviewForm({ projectId, onChange }: { projectId: string; onChange: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ projectId, rating, comment }) });
      onChange();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to submit review.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-slate-100 pt-4">
      <p className="font-medium text-slate-800">Rate the contractor</p>
      {error && <Alert>{error}</Alert>}
      <RatingInput value={rating} onChange={setRating} />
      <Textarea rows={3} placeholder="Share details of your experience…" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Submitting…' : 'Submit review'}</button>
    </form>
  );
}

// Homeowner chat: pick which bidder to talk to.
function OwnerChatPanel({ project, bids }: { project: Project; bids: Bid[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (bids.length === 0) {
    return <div className="card p-6 text-center text-sm text-slate-500">💬 Chat opens once contractors place bids.</div>;
  }
  const active = selected ?? bids[0].contractorId;
  const activeBid = bids.find((b) => b.contractorId === active)!;
  return (
    <div className="card overflow-hidden">
      {bids.length > 1 && (
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 p-2">
          {bids.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelected(b.contractorId)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${active === b.contractorId ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {b.contractor.profile?.businessName || b.contractor.profile?.name || 'Contractor'}
            </button>
          ))}
        </div>
      )}
      <Chat
        key={active}
        projectId={project.id}
        contractorId={active}
        counterpartyName={activeBid.contractor.profile?.businessName || activeBid.contractor.profile?.name || 'Contractor'}
      />
    </div>
  );
}
