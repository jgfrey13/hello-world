'use client';

import { useEffect, useState, useCallback } from 'react';
import { RequireAuth } from '@/components/RequireAuth';
import { ProjectCard, ProjectCardData } from '@/components/ProjectCard';
import { Input, Select, Spinner, Alert } from '@/components/ui';
import { apiFetch, CATEGORY_LABELS } from '@/lib/client';

interface Pagination {
  page: number;
  pages: number;
  total: number;
}

export default function JobBoardPage() {
  return (
    <RequireAuth roles={['CONTRACTOR']}>
      <JobBoard />
    </RequireAuth>
  );
}

function JobBoard() {
  const [projects, setProjects] = useState<ProjectCardData[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ category: '', zip: '', budgetMin: '', budgetMax: '', q: '' });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setProjects(null);
    setError('');
    const params = new URLSearchParams();
    params.set('page', String(page));
    if (filters.category) params.set('category', filters.category);
    if (filters.zip) params.set('zip', filters.zip);
    if (filters.budgetMin) params.set('budgetMin', filters.budgetMin);
    if (filters.budgetMax) params.set('budgetMax', filters.budgetMax);
    if (filters.q) params.set('q', filters.q);
    try {
      const d = await apiFetch<{ projects: ProjectCardData[]; pagination: Pagination }>(
        `/api/projects?${params.toString()}`,
      );
      setProjects(d.projects);
      setPagination(d.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects.');
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Find work</h1>
        <p className="text-sm text-slate-600">Browse open projects and submit your bid.</p>
      </div>

      <form onSubmit={applyFilters} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input placeholder="Search…" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
        <Select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Input placeholder="ZIP code" value={filters.zip} onChange={(e) => setFilters((f) => ({ ...f, zip: e.target.value }))} />
        <Input type="number" placeholder="Min budget" value={filters.budgetMin} onChange={(e) => setFilters((f) => ({ ...f, budgetMin: e.target.value }))} />
        <div className="flex gap-2">
          <Input type="number" placeholder="Max budget" value={filters.budgetMax} onChange={(e) => setFilters((f) => ({ ...f, budgetMax: e.target.value }))} />
          <button type="submit" className="btn-primary shrink-0">Filter</button>
        </div>
      </form>

      {error && <Alert>{error}</Alert>}

      {!projects ? (
        <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>
      ) : projects.length === 0 ? (
        <div className="card p-10 text-center text-slate-600">No open projects match your filters.</div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{pagination?.total} open project{pagination?.total === 1 ? '' : 's'}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary">Previous</button>
              <span className="text-sm text-slate-600">Page {pagination.page} of {pagination.pages}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="btn-secondary">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
