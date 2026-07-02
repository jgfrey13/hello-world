# Content Operations — MadeHere

## Editorial workflow

Content moves through statuses: `draft` → `pending_review` → `published`
(with `rejected` and `archived` as terminal/side states). Editors manage drafts
and recommend publication; admins publish. Classification and evidence approval
are admin-only.

## Roles in content ops

- **Editor**: create/edit draft brands, products, articles; review sources;
  recommend publication; manage categories. Cannot approve evidence, publish
  classifications, or touch roles/billing.
- **Admin**: review evidence, approve classifications, publish/archive, manage
  sponsorships, review claims/corrections/proposed changes.
- **Brand owner**: submit proposed edits and new products (as pending records);
  never directly edits published classification/evidence/editorial fields.

## Sources of content

Manual brand/product entry, CSV import (Phase 9), brand submissions, approved
brand questionnaires, admin-supplied source URLs. No uncontrolled scraping.

## Editorial standards

- American-made claims require sourced evidence (`docs/verification-methodology.md`).
- No fabricated brands, facts, sources, reviews, discounts, or partnerships.
- No verbatim copying of product descriptions or copyrighted articles.
- AI-generated summaries store the source separately; AI output is not evidence.
- Sponsored/affiliate content is conspicuously disclosed and never presented as
  independent editorial.

## Corrections

Public correction submissions enter a review queue (`corrections` table). Admins
triage, verify against sources, and update records. Accurate corrections are
never suppressed, including for paying brands.

## Demo/seed data

Fictional, clearly labeled, removable via `npm run db:seed:remove`. The admin UI
warns that demo data must not be published as factual content. Never invent
manufacturing claims about real companies.

## SEO / page quality

A brand or product page must meet a page-quality threshold before it is
indexable (sufficient sourced information, not thin/duplicate). Drafts, admin,
account, and thin pages are `noindex`. No doorway or near-duplicate location
pages. See `lib/seo`.
