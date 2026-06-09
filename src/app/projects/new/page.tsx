'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { Field, Input, Textarea, Select, Alert } from '@/components/ui';
import { apiFetch, ApiClientError, CATEGORY_LABELS, URGENCY_LABELS } from '@/lib/client';

const CATEGORIES = Object.keys(CATEGORY_LABELS);
const URGENCIES = Object.keys(URGENCY_LABELS);
const STEPS = ['Basics', 'Details', 'Budget', 'Location', 'Photos'];

export default function NewProjectPage() {
  return (
    <RequireAuth roles={['HOMEOWNER']}>
      <Wizard />
    </RequireAuth>
  );
}

function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    category: 'PLUMBING',
    description: '',
    urgency: 'FLEXIBLE',
    requestQuotes: false,
    budgetMin: '',
    budgetMax: '',
    city: '',
    zip: '',
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep(): string | null {
    if (step === 0 && !form.title.trim()) return 'Please enter a project title.';
    if (step === 1 && !form.description.trim()) return 'Please describe your project.';
    if (step === 2 && !form.requestQuotes && !form.budgetMin && !form.budgetMax)
      return 'Enter a budget range or choose “Request quotes”.';
    if (step === 3) {
      if (!form.city.trim()) return 'Please enter your city.';
      if (!/^\d{5}(-\d{4})?$/.test(form.zip.trim())) return 'Please enter a valid ZIP code.';
    }
    return null;
  }

  function next() {
    const v = validateStep();
    if (v) return setError(v);
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted = Array.from(list).filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
    );
    setFiles((prev) => [...prev, ...accepted].slice(0, 10));
  }

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        urgency: form.urgency,
        requestQuotes: form.requestQuotes,
        budgetMin: form.requestQuotes || !form.budgetMin ? undefined : Number(form.budgetMin),
        budgetMax: form.requestQuotes || !form.budgetMax ? undefined : Number(form.budgetMax),
        city: form.city,
        zip: form.zip,
      };
      const { project } = await apiFetch<{ project: { id: string } }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        await apiFetch(`/api/projects/${project.id}/media`, { method: 'POST', body: fd });
      }

      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to create project.');
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Post a new project</h1>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {i + 1}
            </span>
            <span className={`hidden text-xs sm:inline ${i === step ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
          </li>
        ))}
      </ol>

      <div className="card mt-6 space-y-5 p-6">
        {error && <Alert>{error}</Alert>}

        {step === 0 && (
          <>
            <Field label="Project title">
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Replace leaking kitchen faucet" autoFocus />
            </Field>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </Select>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Describe the work" hint="Include as much detail as you can — scope, materials, problems.">
              <Textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe what needs to be done…" autoFocus />
            </Field>
            <Field label="Timeline / urgency">
              <Select value={form.urgency} onChange={(e) => set('urgency', e.target.value)}>
                {URGENCIES.map((u) => (
                  <option key={u} value={u}>{URGENCY_LABELS[u]}</option>
                ))}
              </Select>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.requestQuotes} onChange={(e) => set('requestQuotes', e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
              I’m not sure of a budget — request quotes from contractors
            </label>
            {!form.requestQuotes && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Minimum budget ($)">
                  <Input type="number" min={0} value={form.budgetMin} onChange={(e) => set('budgetMin', e.target.value)} placeholder="500" />
                </Field>
                <Field label="Maximum budget ($)">
                  <Input type="number" min={0} value={form.budgetMax} onChange={(e) => set('budgetMax', e.target.value)} placeholder="2000" />
                </Field>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Austin" autoFocus />
            </Field>
            <Field label="ZIP code">
              <Input value={form.zip} onChange={(e) => set('zip', e.target.value)} placeholder="78701" />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div>
            <p className="label">Photos &amp; videos (optional)</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragOver ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="text-3xl">📷</div>
              <p className="mt-2 text-sm font-medium text-slate-700">Drag &amp; drop files here</p>
              <p className="text-xs text-slate-500">or click to browse · up to 10 files, 25MB each</p>
              <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </div>

            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {files.map((f, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                    {f.type.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-800 text-2xl text-white">🎬</div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFiles((prev) => prev.filter((_, idx) => idx !== i)); }}
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting} className="btn-secondary">
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="btn-primary">Continue</button>
        ) : (
          <button onClick={submit} disabled={submitting} className="btn-primary">
            {submitting ? 'Posting…' : 'Post project'}
          </button>
        )}
      </div>
    </div>
  );
}
