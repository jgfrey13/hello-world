# Rule: Accessibility

Target WCAG 2.1 AA.

## Requirements

- Full keyboard navigation; visible focus states on all interactive elements.
- Semantic HTML (landmarks, headings in order, lists, buttons vs links).
- Every form control has an associated label; validation messages are
  programmatically associated and announced.
- Color contrast meets AA against the ivory/navy/charcoal token palette.
- All meaningful images have alt text; decorative images are hidden from AT.
- Respect `prefers-reduced-motion`.
- Responsive, mobile-first layouts.
- Accessible dialogs/modals (focus trap, escape, restore focus) — use Radix
  primitives.
- Accessible filter controls and mobile filter drawer.
- Clear loading indicators, empty states, and error boundaries.

## Verification

Run axe checks in Playwright on key public pages. Manual keyboard pass on
directory, filters, forms, and dialogs before a UI phase is considered done. Do
not sacrifice usability for decorative effects.
