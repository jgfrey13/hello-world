/**
 * Policy-page template drafts. Every document here is a TEMPLATE requiring
 * qualified legal review before production — the UI must say so. Editable
 * admin-managed versions replace these when the editorial phase lands.
 */

export interface PolicyDoc {
  slug: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
}

export const policies: PolicyDoc[] = [
  {
    slug: "affiliate-disclosure",
    title: "Affiliate Disclosure",
    summary:
      "How affiliate links work on MadeHere and why they never affect our classifications.",
    sections: [
      {
        heading: "We may earn commissions",
        body: "Some outbound links on MadeHere are affiliate links. When you buy through them, we may earn a commission at no additional cost to you. Purchase buttons always carry a nearby disclosure.",
      },
      {
        heading: "Commissions never buy outcomes",
        body: "Affiliate relationships never influence manufacturing classifications, verification decisions, editorial conclusions, or product recommendations. We link to products because they fit the page, not because of the commission.",
      },
    ],
  },
  {
    slug: "sponsorship-policy",
    title: "Sponsorship Policy",
    summary: "How paid placements are sold, labeled, and firewalled.",
    sections: [
      {
        heading: "Every paid placement is labeled",
        body: "Sponsored guides, featured placements, and newsletter sponsorships are conspicuously labeled every time they appear. Paid content is never presented as independent editorial.",
      },
      {
        heading: "What sponsorship cannot buy",
        body: "Sponsorship cannot change a manufacturing classification, guarantee verification, remove accurate unfavorable information, suppress a correction, or purchase a recommendation.",
      },
    ],
  },
  {
    slug: "editorial-standards",
    title: "Editorial Standards",
    summary: "The rules our editorial content follows.",
    sections: [
      {
        heading: "Evidence-based claims",
        body: "American-made claims require supporting evidence. We classify at the product level where possible, cite sources with access dates, and show last-reviewed dates. We never infer domestic manufacturing from headquarters, ownership, imagery, or branding.",
      },
      {
        heading: "Independence",
        body: "Editorial conclusions are made independently of advertising, affiliate, and subscription revenue. Errors are corrected promptly and transparently.",
      },
    ],
  },
  {
    slug: "correction-policy",
    title: "Correction Policy",
    summary: "How we handle mistakes.",
    sections: [
      {
        heading: "Report anything",
        body: "Anyone can submit a correction from any page. Corrections enter a review queue, are verified against sources, and are applied when substantiated.",
      },
      {
        heading: "No suppression",
        body: "An accurate correction is never delayed or suppressed because the affected brand advertises with us or subscribes to a paid plan.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What we collect and what we deliberately do not.",
    sections: [
      {
        heading: "Data minimization",
        body: "We collect only what the platform needs to operate. We do not collect precise visitor location, full IP history, or cross-site behavioral profiles, and we do not sell personal information. First-party analytics use anonymous session identifiers.",
      },
      {
        heading: "Your choices",
        body: "Newsletter subscriptions record consent time and source, and every message includes an unsubscribe link. Contact us to access or delete information you have submitted.",
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Use",
    summary: "The agreement governing use of MadeHere.",
    sections: [
      {
        heading: "Informational use",
        body: "MadeHere provides research and editorial information, not certification. Manufacturing statuses reflect evidence reviewed as of the date shown and may change. Verify claims independently before relying on them for significant decisions.",
      },
      {
        heading: "Acceptable use",
        body: "Do not scrape the site in violation of these terms, misrepresent affiliation in profile claims, or submit fabricated evidence.",
      },
    ],
  },
  {
    slug: "ai-use",
    title: "AI-Use Disclosure",
    summary: "Where AI assists and where humans decide.",
    sections: [
      {
        heading: "AI assists research; it is not evidence",
        body: "We may use AI tools to summarize sources and draft internal research notes. AI output is never treated as evidence: classifications rely on underlying cited sources, and human reviewers make every approval decision.",
      },
    ],
  },
  {
    slug: "data-sources",
    title: "Data-Source Policy",
    summary: "Where our information comes from.",
    sections: [
      {
        heading: "Permitted sources only",
        body: "Our records come from brand submissions, questionnaires, public pages accessed in accordance with their terms, approved data feeds, and administrator research. We do not circumvent access controls, copy product descriptions verbatim, or republish copyrighted articles.",
      },
    ],
  },
];

export function getPolicy(slug: string): PolicyDoc | undefined {
  return policies.find((policy) => policy.slug === slug);
}
