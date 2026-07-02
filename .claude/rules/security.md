# Rule: Security

Security is a release requirement, not a follow-up.

## Authorization

- Enforce server-side **and** at the database (RLS). UI hiding is never the boundary.
- Public users read only published public records.
- Brand owners access only authorized brand-management data (their approved brands).
- Editors cannot manage roles or payment credentials.
- No user can elevate their own role. Role assignment is admin-only and audited.
- Admin routes are guarded in server code (middleware + per-action checks), not
  just by hidden nav.

## Input / output

- Validate every input with the shared Zod schema for that entity.
- Encode/sanitize output. No raw HTML injection from user content.
- File uploads: restrict MIME type and size; store in Supabase Storage with
  scoped policies; never trust client-provided content type alone.

## Network / integration

- Allowlist and validate redirect destinations (`/go/[slug]`). Reject malformed
  or non-approved URLs.
- Verify Stripe webhook signatures; process webhooks idempotently.
- Rate-limit public forms; add spam protection (honeypot/token).
- CSRF protection on state-changing non-idempotent endpoints where relevant.
- Secure cookies; appropriate security headers.

## Secrets & logging

- Validate all env vars at startup with a Zod schema; fail fast if missing.
- Never log secrets or unnecessary PII. Redact tokens.
- Service-role/Stripe/Resend secrets are server-only. `.env*` git-ignored.

## Never expose

Service-role keys, Stripe/Resend secrets, DB passwords, internal notes,
unreviewed evidence, private submitter information.

## Review gate

Before completing the security phase (and before launch), run a dedicated
security-review pass (see `.claude/agents/database-security-reviewer.md`)
covering RLS, privilege escalation, IDOR, unsafe redirects, injection, file
uploads, webhooks, auth flows, admin routes, and information leakage.
