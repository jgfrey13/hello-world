import Link from 'next/link';
import { CATEGORY_LABELS } from '@/lib/client';

const STEPS = [
  { title: 'Post your project', body: 'Describe the work, add photos, set a budget or request quotes.', icon: '📝' },
  { title: 'Compare bids', body: 'Licensed local contractors send competitive proposals you can compare side-by-side.', icon: '⚖️' },
  { title: 'Hire & get it done', body: 'Chat securely, accept the best bid, and review the work when it’s finished.', icon: '✅' },
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="grid items-center gap-10 pt-6 md:grid-cols-2">
        <div>
          <span className="badge bg-brand-100 text-brand-700">Trusted local contractors</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Get your home project done — at the right price.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Post any home improvement job and receive competitive bids from vetted, licensed
            contractors in your area. Compare, chat, and hire with confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register?role=HOMEOWNER" className="btn-primary px-6 py-3 text-base">
              I need work done
            </Link>
            <Link href="/register?role=CONTRACTOR" className="btn-secondary px-6 py-3 text-base">
              I’m a contractor
            </Link>
          </div>
        </div>
        <div className="card overflow-hidden p-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(CATEGORY_LABELS).slice(0, 8).map(([key, label]) => (
              <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-3xl font-bold text-slate-900">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={i} className="card p-6">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-brand-600 px-8 py-12 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to start?</h2>
        <p className="mx-auto mt-2 max-w-xl text-brand-100">
          Join thousands of homeowners and contractors getting projects done the smarter way.
        </p>
        <Link href="/register" className="btn mt-6 bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
          Create your free account
        </Link>
      </section>
    </div>
  );
}
