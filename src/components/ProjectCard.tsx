import Link from 'next/link';
import { CATEGORY_LABELS, STATUS_STYLES, formatBudget } from '@/lib/client';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ').toLowerCase()}
    </span>
  );
}

export interface ProjectCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  city: string;
  zip: string;
  budgetMin: number | null;
  budgetMax: number | null;
  requestQuotes: boolean;
  createdAt: string;
  media?: { fileUrl: string; type: string }[];
  _count?: { bids: number };
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const cover = project.media?.find((m) => m.type === 'IMAGE');
  return (
    <Link href={`/projects/${project.id}`} className="card group flex flex-col overflow-hidden transition hover:shadow-md">
      <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.fileUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-slate-300">
            {CATEGORY_ICON[project.category] ?? '🛠️'}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="badge bg-brand-50 text-brand-700">{CATEGORY_LABELS[project.category]}</span>
          <StatusBadge status={project.status} />
        </div>
        <h3 className="mt-2 line-clamp-1 font-semibold text-slate-900">{project.title}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">{project.description}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-900">
            {formatBudget(project.budgetMin, project.budgetMax, project.requestQuotes)}
          </span>
          <span className="text-slate-500">📍 {project.city}</span>
        </div>
        {project._count && (
          <p className="mt-2 text-xs text-slate-500">{project._count.bids} bid{project._count.bids === 1 ? '' : 's'}</p>
        )}
      </div>
    </Link>
  );
}

const CATEGORY_ICON: Record<string, string> = {
  PLUMBING: '🚰',
  HVAC: '❄️',
  ROOFING: '🏘️',
  ELECTRICAL: '⚡',
  PAINTING: '🎨',
  LANDSCAPING: '🌳',
  CARPENTRY: '🪚',
  FLOORING: '🧱',
  REMODELING: '🏗️',
  GENERAL: '🛠️',
};
