# Launch Checklist — MadeHere

## Definition of done (per feature)

- [ ] Backed by real application logic (no placeholder posing as integration).
- [ ] Uses the intended database.
- [ ] Authorization enforced server-side (and RLS).
- [ ] Input validated with the shared Zod schema.
- [ ] Loading, empty, success, and error states exist.
- [ ] Mobile behavior works.
- [ ] Relevant tests pass.
- [ ] Types pass (`npm run typecheck`).
- [ ] Lint passes (`npm run lint`).
- [ ] Production build succeeds (`npm run build`).
- [ ] Documentation updated.

## MVP completion criteria

- [ ] Visitors browse published brands and products.
- [ ] Search and filters use backend data (no client-side full-table filtering).
- [ ] Brand and product pages use database records.
- [ ] Admins can manage records (CRUD + publish/archive).
- [ ] Evidence has a review workflow.
- [ ] Claims require authentication and admin approval.
- [ ] Corrections enter a review queue.
- [ ] Brand-owner edits remain pending until approved.
- [ ] Affiliate clicks use safe `/go/[slug]` redirects and are recorded.
- [ ] Newsletter signups stored with consent timestamp/source.
- [ ] Drafts and internal notes remain private (RLS-verified).
- [ ] RLS independently reviewed (database-security-reviewer).
- [ ] Stripe test subscriptions work end-to-end.
- [ ] Mobile layouts work.
- [ ] Primary pages have SEO metadata; drafts/admin `noindex`.
- [ ] Affiliate and sponsored content disclosed everywhere.
- [ ] Demo data clearly marked and removable.
- [ ] No secrets committed.
- [ ] No critical security findings remain.
- [ ] Primary end-to-end tests pass.
- [ ] Deployment instructions complete.

## Pre-production gates

- [ ] Security review pass (RLS, escalation, IDOR, redirects, injection, uploads,
      webhooks, auth, admin routes, leakage).
- [ ] Accessibility review pass (axe + manual keyboard on directory/filters/forms/dialogs).
- [ ] SEO review (metadata, sitemap, robots, structured data, indexability gate).
- [ ] Performance review (query efficiency, image sizing, bundle size).
- [ ] Legal/policy pages reviewed by counsel.
- [ ] Stripe production gate (see `docs/deployment.md`).
- [ ] Email sender-domain auth + unsubscribe verified.
- [ ] Backup/restore documented.
- [ ] Demo-data removal executed on production.
