# Rule: Testing

Test business risk, not superficial rendering. Prefer a smaller number of
meaningful tests over coverage-padding.

## Required coverage areas

**Authorization**
- Visitor cannot read drafts or access admin pages.
- Brand owner cannot access another brand or alter manufacturing evidence.
- Editor cannot change administrator roles.
- Unauthorized users cannot create paid status.
- Admin routes require authorization.

**Affiliate redirects**
- Published product redirects correctly; direct-URL fallback works.
- Unsafe URL rejected; inactive/missing product handled gracefully.
- Click event is recorded.

**Profile claims**
- Auth required; a claim creates a pending record and grants no immediate access;
  duplicate pending claims handled.

**Manufacturing evidence**
- Evidence requires a source; approval records the reviewer; brand owners cannot
  approve; public pages never expose internal notes.

**Stripe**
- Valid webhook updates subscription; invalid signature rejected; duplicate
  webhook does not double-apply; canceled subscription preserves Basic listing.

**Forms**
- Validation works; spam/rate limits enforced; sensitive data never shown publicly.

**Search**
- Filters return correct results; query params persist; drafts excluded;
  pagination stable.

## E2E (Playwright)

Browse→product, affiliate redirect, submit a brand, account→claim, admin reviews
claim, admin creates+publishes brand, brand owner proposes change, admin reviews
evidence. Include axe accessibility checks on key public pages.

## Gate

Types, lint, unit/integration, and production build must pass to finish a phase.
Never disable a security control or ignore a failing test to go green.
