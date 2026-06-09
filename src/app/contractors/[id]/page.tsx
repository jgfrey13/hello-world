'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RatingDisplay } from '@/components/StarRating';
import { Alert, Spinner } from '@/components/ui';
import { apiFetch, CATEGORY_LABELS } from '@/lib/client';

interface PublicProfile {
  name: string;
  businessName: string | null;
  bio: string | null;
  city: string | null;
  categories: string[];
  serviceRadiusMiles: number | null;
  ratingAvg: number;
  ratingCount: number;
}
interface Review { rating: number; comment: string | null; createdAt: string }

export default function ContractorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ profile: PublicProfile; reviews: Review[] }>(`/api/profile/${id}`)
      .then((d) => { setProfile(d.profile); setReviews(d.reviews); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <Alert>{error}</Alert>;
  if (!profile) return <div className="flex justify-center py-20"><Spinner className="text-brand-600" /></div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{profile.businessName || profile.name}</h1>
            {profile.businessName && <p className="text-slate-600">{profile.name}</p>}
            {profile.city && <p className="mt-1 text-sm text-slate-500">📍 {profile.city}{profile.serviceRadiusMiles ? ` · serves ${profile.serviceRadiusMiles} mi` : ''}</p>}
          </div>
          <RatingDisplay value={profile.ratingAvg} count={profile.ratingCount} />
        </div>
        {profile.bio && <p className="mt-4 whitespace-pre-wrap text-slate-700">{profile.bio}</p>}
        {profile.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.categories.map((c) => (
              <span key={c} className="badge bg-brand-50 text-brand-700">{CATEGORY_LABELS[c]}</span>
            ))}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold">Reviews ({profile.ratingCount})</h2>
        {reviews.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {reviews.map((r, i) => (
              <li key={i} className="border-b border-slate-100 pb-4 last:border-0">
                <RatingDisplay value={r.rating} />
                {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
                <p className="mt-1 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
