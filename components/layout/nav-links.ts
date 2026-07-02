export interface NavLink {
  href: string;
  label: string;
}

export const primaryNavLinks: NavLink[] = [
  { href: "/brands", label: "Brands" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/guides", label: "Guides" },
  { href: "/methodology", label: "Methodology" },
];

export const secondaryNavLinks: NavLink[] = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "For Brands" },
  { href: "/submit", label: "Submit a Brand" },
];

export const footerLinkGroups: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Discover",
    links: [
      { href: "/brands", label: "Brand directory" },
      { href: "/products", label: "Product directory" },
      { href: "/categories", label: "Categories" },
      { href: "/guides", label: "Shopping guides" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { href: "/methodology", label: "Verification methodology" },
      { href: "/policies/editorial-standards", label: "Editorial standards" },
      { href: "/policies/affiliate-disclosure", label: "Affiliate disclosure" },
      { href: "/correction", label: "Submit a correction" },
    ],
  },
  {
    heading: "For brands",
    links: [
      { href: "/pricing", label: "Plans & pricing" },
      { href: "/submit", label: "Submit a brand" },
      { href: "/claim", label: "Claim a profile" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/policies", label: "Policies" },
      { href: "/policies/privacy", label: "Privacy" },
      { href: "/policies/terms", label: "Terms of use" },
    ],
  },
];
