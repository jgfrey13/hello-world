# Rule: Frontend

## Design tokens (no arbitrary values)

Define once in Tailwind config / CSS variables; never scatter hex codes.

- Background: warm ivory
- Primary: deep navy
- Accent: muted brick-red (used sparingly)
- Text: charcoal
- Borders: restrained gray
- Headings: editorial serif; UI/body: readable sans-serif
- Generous spacing, minimal shadows, consistent cards, mobile-first

Visual tone: credible, modern, premium, editorial, non-partisan. **Avoid** flag
imagery, nationalistic slogans, rustic Americana clichés, cheap marketplace
aesthetics, and generic AI factory imagery.

## Component rules

- Use the shared `ui/` primitives (shadcn/Radix). Do not fork a second version of
  an existing pattern.
- Every interactive surface has loading, empty, success, and error states.
- Forms: shared Zod schema, associated labels, accessible validation messages.
- Images: always provide alt text; use Next.js image sizing.

## States are mandatory

A screen is not done until loading, empty, and error states exist and work on
mobile. See `.claude/rules/accessibility.md`.

## Disclosure

Purchase buttons must render an affiliate disclosure nearby. Sponsored content
must render a conspicuous sponsored label. These are components, not optional copy.
