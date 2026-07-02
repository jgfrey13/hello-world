# Security — MadeHere

Security is a release requirement. See `.claude/rules/security.md` for the durable
rules; this document is the threat model and control inventory.

## Trust boundaries

- **Anon/public** → can read only published public records via RLS.
- **Authenticated user** → own profile + own submissions; brand-management access
  only for approved brands.
- **Editor** → drafts + recommendations; no roles/billing.
- **Admin** → full management via server actions using the service-role client.
- **Service-role key** → trusted server code only (webhooks, admin actions). Never
  shipped to the client.

## Threat model (STRIDE-lite) & mitigations

| Threat | Vector | Mitigation |
|---|---|---|
| Privilege escalation | User sets own `role` | Role writes admin-only; RLS forbids self-update of role; audited. |
| IDOR | Guessing brand/product/claim ids | Authorization checks on every object access; RLS row ownership. |
| Draft/PII leakage | Reading unpublished rows, internal notes | RLS restricts anon to `published`; internal notes/evidence never anon-readable. |
| Unsafe redirect | `/go/[slug]` open redirect | Destination validated + allowlisted; malformed rejected. |
| Injection (SQL/XSS) | Form input, user content | Parameterized queries; Zod validation; output encoding; no raw HTML. |
| Webhook spoofing | Fake Stripe events | Signature verification + idempotency keys. |
| Malicious upload | Bad MIME/oversized files | MIME + size limits; scoped Storage policies; no trust of client content-type. |
| Spam/abuse | Public forms | Rate limiting + honeypot/token. |
| Secret exposure | Logs, client bundle, repo | Env Zod validation; secrets server-only; `.env*` git-ignored; secrets redacted from logs. |
| Paid-influence integrity | Buying a classification | Classification/evidence admin-only, independent of billing. |

## Control inventory

- Supabase RLS on every table with explicit policies.
- Server-side `requireRole()` checks in `lib/auth` for admin/editor/owner routes.
- Middleware guards `app/admin` and `app/brand-dashboard`; per-action checks too.
- Shared Zod schemas validate all inputs (`lib/validation`).
- `lib/security`: env schema, rate limiter, redirect allowlist, security headers,
  secure cookies.
- Stripe webhook signature verification + idempotency (`app/api/stripe/webhook`).
- Audit log for sensitive admin actions.

## Review gate

Before the security phase and launch, run the `database-security-reviewer`
subagent over RLS, privilege escalation, IDOR, redirects, injection, uploads,
webhooks, auth flows, admin routes, and information leakage. No critical findings
may remain at launch.
