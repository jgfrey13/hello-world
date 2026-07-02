# Verification Methodology — MadeHere

MadeHere is an **evidence-based editorial platform**, not a certification body.
We never certify "Made in USA." We record what the evidence shows, classify it
honestly, cite sources, and let consumers judge.

## Classification (product level where possible)

Store the enum value; display the human-readable label.

| Enum value                               | Display label                           | Meaning                                                                  |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| `verified_made_in_usa`                   | Verified Made in USA                    | Domestic manufacturing supported by reviewed, approved evidence.         |
| `brand_reported_made_in_usa`             | Brand-Reported Made in USA              | Brand claims domestic manufacturing; not yet independently corroborated. |
| `made_in_usa_imported_components`        | Made in USA With Imported Components    | Assembled/made domestically but contains imported materials/components.  |
| `assembled_in_usa`                       | Assembled in USA                        | Final assembly domestic; components may be foreign.                      |
| `certain_products_made_in_usa`           | Selected Products Made in USA           | Only some of the brand's products are domestically made.                 |
| `designed_in_usa_manufactured_elsewhere` | Designed in USA; Manufactured Elsewhere | Design domestic, manufacturing foreign. Not "Made in USA."               |
| `us_owned_unconfirmed_manufacturing`     | U.S.-Owned; Manufacturing Unconfirmed   | U.S. ownership only; manufacturing location unverified.                  |
| `unclear`                                | Manufacturing Status Unclear            | Conflicting or insufficient information.                                 |
| `awaiting_review`                        | Awaiting Review                         | Not yet assessed.                                                        |

## Never infer domestic manufacturing from

- U.S. headquarters
- American founder / U.S. workers
- American imagery or a name containing "USA"/"America"
- "Designed in America"
- The brand having _some_ U.S.-made products

Mixed-sourcing brands are never presented as if all products are domestic.

## Evidence record fields

Brand and (where applicable) product; classification; manufacturing location;
source URL; source title; evidence note; date accessed; evidence type; confidence
score; human-review status; reviewer; review date; last-verified date; dispute
status; internal notes.

- Evidence **cannot reach `approved` without a source URL** (DB check + validation).
- **Internal notes and unreviewed evidence are never public.**
- AI-generated summaries store the underlying source separately; AI output is
  never treated as evidence, and search-result snippets are never sole evidence
  for important claims.

## Review workflow

`pending` → reviewer assesses → `approved` / `rejected` / `needs_more_information`.
Approval records reviewer + timestamp. Brand owners can submit evidence but can
never approve it. Classification changes are admin-only and independent of billing.

## Re-verification

Records carry `last_verified_at`; the pipeline (Phase 9) re-checks periodically
and flags stale records, broken links, and discontinued products for review.

## Paid-content firewall

A paid subscription never alters a classification, guarantees verification,
removes accurate unfavorable information, suppresses a correction, buys a
recommendation, or changes the evidence standard.
