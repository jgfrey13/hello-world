// Lightweight client-side fetch wrapper for the JSON API. Throws an Error with
// the server-provided message on non-2xx responses.

export class ApiClientError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    credentials: 'same-origin',
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new ApiClientError(res.status, data.error || 'Request failed', data.details);
  }
  return data as T;
}

// Formats a budget range for display.
export function formatBudget(
  min: number | null,
  max: number | null,
  requestQuotes: boolean,
): string {
  if (requestQuotes || (min == null && max == null)) return 'Requesting quotes';
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  PLUMBING: 'Plumbing',
  HVAC: 'HVAC',
  ROOFING: 'Roofing',
  ELECTRICAL: 'Electrical',
  PAINTING: 'Painting',
  LANDSCAPING: 'Landscaping',
  CARPENTRY: 'Carpentry',
  FLOORING: 'Flooring',
  REMODELING: 'Remodeling',
  GENERAL: 'General',
};

export const URGENCY_LABELS: Record<string, string> = {
  EMERGENCY: 'Emergency',
  WITHIN_WEEK: 'Within 1 week',
  WITHIN_MONTH: 'Within 1 month',
  FLEXIBLE: 'Flexible',
};

export const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-slate-200 text-slate-700',
  CANCELLED: 'bg-red-100 text-red-700',
  FLAGGED: 'bg-amber-100 text-amber-800',
};
