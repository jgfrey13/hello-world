'use client';

import { useState } from 'react';

function Star({ filled, half = false }: { filled: boolean; half?: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor">
      {half && (
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.75 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.79.57-1.84-.2-1.54-1.12l1.36-4.18a1 1 0 00-.36-1.12L1.4 9.6c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69l1.36-4.18z"
        fill={half ? 'url(#half)' : undefined}
      />
    </svg>
  );
}

// Read-only display of an average rating.
export function RatingDisplay({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= Math.round(value)} />
      ))}
      <span className="ml-1 text-sm text-slate-600">
        {value > 0 ? value.toFixed(1) : 'New'}
        {count !== undefined && count > 0 && <span className="text-slate-400"> ({count})</span>}
      </span>
    </span>
  );
}

// Interactive star input for submitting a review.
export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="inline-flex items-center gap-1 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          className="transition hover:scale-110"
        >
          <Star filled={i <= (hover || value)} />
        </button>
      ))}
    </div>
  );
}
