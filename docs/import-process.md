# Import Process & Research Pipeline — MadeHere

## Ingestion status pipeline

```
discovered → queued → fetched → extracted → normalized → matched →
drafted → needs_review → approved → published
                                   ↘ rejected
                                   ↘ failed
```

Records carry field-level confidence and source references. Uncertain records
route to `needs_review`; nothing auto-publishes conflicting manufacturing claims.

## MVP scope (Phase 9)

Implemented in the first release:

- Manual brand entry and manual product entry.
- **CSV import with preview + validation** (row-level errors shown before commit).
- Source-URL and research-note entry.
- Evidence-review queue.
- Duplicate-domain detection (normalize domain; flag collisions).
- Broken-link-checking architecture (scheduled job scaffold).
- Draft-generation interface placeholder (clearly marked; not auto-published).
- Scheduled-job framework.

**Not** in the first release: uncontrolled autonomous scraping.

## CSV import contract

- Upload → parse → validate each row against the entity's Zod schema →
  preview table with per-row status (ok / warning / error) → admin confirms →
  rows created as `draft`/`pending_review` (never auto-published).
- Duplicate domains/slugs flagged and skipped or merged on admin decision.
- Import job status tracked; failures logged (no secrets).

## Automation restrictions (hard rules)

Do not: scrape in violation of terms/anti-bot controls; circumvent bot
protections; copy descriptions verbatim; republish copyrighted articles;
fabricate data; auto-certify Made in USA; auto-publish conflicting claims; treat
AI output as evidence; create fake sources; use search snippets as sole evidence.

AI-generated research stores the underlying source separately from the generated
summary.

## Future pipeline (architecture-ready)

Candidate discovery, name/domain normalization, dedup, consumer-product
detection, product/category extraction, manufacturing-claim detection, source
storage, field confidence, contradiction detection, draft summaries, review
routing, periodic re-checks, broken-link/discontinued detection.
