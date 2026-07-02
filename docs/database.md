# Database — MadeHere

Postgres via Supabase. Every table: UUID PK (`gen_random_uuid()`),
`created_at`/`updated_at` (trigger-maintained), FK constraints with explicit
`on delete`, indexes on slug/FK/filter columns, check constraints on enums, and
RLS enabled. Types are generated into `lib/database/types.ts` after every change.

## Enums

- **user role**: `visitor` (implicit/no-account), `brand_owner`, `editor`, `admin`
- **content status**: `draft`, `pending_review`, `published`, `rejected`, `archived`
- **manufacturing_classification**: `verified_made_in_usa`,
  `brand_reported_made_in_usa`, `made_in_usa_imported_components`,
  `assembled_in_usa`, `certain_products_made_in_usa`,
  `designed_in_usa_manufactured_elsewhere`, `us_owned_unconfirmed_manufacturing`,
  `unclear`, `awaiting_review`
- **evidence review_status**: `pending`, `approved`, `rejected`,
  `needs_more_information`
- **article_type**: `shopping_guide`, `brand_story`, `founder_story`,
  `factory_story`, `comparison`, `buying_guide`, `news`
- **subscription plan/tier**: `basic`, `verified`, `featured`
- **ingestion status**: `discovered`, `queued`, `fetched`, `extracted`,
  `normalized`, `matched`, `drafted`, `needs_review`, `approved`, `published`,
  `rejected`, `failed`

## Entities (summary)

- **profiles** — `id`, `user_id` (FK auth.users, unique), `full_name`,
  `organization`, `job_title`, `role`, timestamps. Role is admin-set only.
- **brands** — identity, description, `website_url`, media paths, HQ location,
  `price_level`, `status`, `verification_status`, `is_featured`, `is_sponsored`,
  `subscription_tier`, `last_reviewed_at`, `published_at`, timestamps.
- **categories** — `name`, `slug`, `description`, `image_path`,
  `parent_category_id` (self-FK), `display_order`, `is_active`.
- **brand_categories** — (`brand_id`, `category_id`) composite PK.
- **products** — `brand_id`, `category_id`, identity, price + `price_currency`,
  `price_is_approximate`, `price_verified_at`, `direct_purchase_url`,
  `affiliate_url`, `affiliate_network`, `affiliate_disclosure_required`,
  `manufacturing_classification`, manufacturing location, `materials`,
  `imported_components_note`, `warranty_summary`, `shipping_summary`, `status`,
  `is_featured`, `is_sponsored`, `last_reviewed_at`, `published_at`.
- **manufacturing_evidence** — `brand_id`, `product_id` (nullable), `classification`,
  `source_url`, `source_title`, `evidence_note`, `evidence_type`, `accessed_at`,
  `confidence_score`, `review_status`, `reviewed_by`, `reviewed_at`,
  `last_verified_at`, `dispute_status`, `internal_notes` (never public).
  Check: cannot be `approved` without `source_url`.
- **manufacturing_locations** — `brand_id`, facility, address, geo, `location_type`,
  `source_url`, `verification_status`.
- **articles** — identity, `body`, `article_type`, `author_id`, `status`,
  `is_sponsored`, `sponsor_brand_id`, `affiliate_disclosure_required`,
  `published_at`, `seo_title`, `seo_description`.
- **article_brands** — (`article_id`, `brand_id`).
- **article_products** — `article_id`, `product_id`, `display_order`,
  `editorial_label`, `sponsorship_status`.
- **affiliate_clicks** — `product_id`, `brand_id`, `article_id`,
  `destination_type`, `destination_url`, `referrer_path`, `anonymous_session_id`,
  `clicked_at`. No unnecessary PII.
- **brand_claims** — `brand_id`, `user_id`, applicant details, `company_email`,
  `proof_path`, `comments`, `status`, `reviewed_by`, `reviewed_at`.
- **brand_submissions** — public submission fields, `status`.
- **proposed_changes** — generic pending-change model: `brand_id`, `product_id`,
  `submitted_by`, `change_type`, `proposed_data` (jsonb), `rationale`,
  `source_url`, `status`, `reviewed_by`, `reviewed_at`.
- **corrections** — `brand_id`, `product_id`, `page_url`, `issue_description`,
  `proposed_correction`, `supporting_source_url`, `submitter_email`, `status`,
  reviewer fields.
- **newsletter_subscribers** — normalized unique `email`, `first_name`, `status`,
  `consent_at`, `consent_source`, `unsubscribed_at`.
- **sponsorships** — `brand_id`, `placement_type`, `placement_location`,
  `start_date`, `end_date`, `status`, `disclosure_text`, `amount`.
- **subscriptions** — `brand_id`, `user_id`, `plan`, `payment_provider`,
  `provider_customer_id`, `provider_subscription_id`, `status`,
  `current_period_start`, `current_period_end`. Stripe-synced server-side only.
- **analytics_events** — restrained first-party events (brand/product views,
  affiliate clicks, newsletter/submission conversions).
- **audit_log** — `actor`, `action`, `entity`, `entity_id`, `before`, `after`,
  `created_at`. No secrets or full payment details.
- **ingestion_records** — pipeline rows with `status` enum, source refs,
  field-level confidence, dedup keys. (Phase 9.)

## RLS baseline

Anon: `select` only where `status = 'published'` on public tables; never
`internal_notes`, unreviewed evidence, submitter PII, or `audit_log`. Brand
owners: read their approved brands; write only to pending-submission tables.
Editors: manage drafts/recommend; no roles/billing. Admin: full via service
paths. Service-role key only in trusted server code.

## Integrity rules

`manufacturing_classification` is admin-controlled — not writable by brand owners
or billing flows. Evidence requires a source before `approved`. Email uniqueness
on `newsletter_subscribers`. Slugs unique per entity.
