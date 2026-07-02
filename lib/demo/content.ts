import type { ManufacturingClassification } from "@/lib/verification/classification";

/**
 * FICTIONAL DEMO CONTENT — Phase 1 only.
 *
 * Every brand, product, guide, and claim in this file is invented for layout
 * demonstration. None of these companies exist. Nothing here may be published
 * as factual content. This module is replaced by database queries
 * (lib/database) in Phases 2–3 and removed with the demo-data scripts.
 */

export const DEMO_CONTENT_NOTICE =
  "Fictional demonstration content — these brands and products do not exist.";

export interface DemoCategory {
  slug: string;
  name: string;
  description: string;
}

export interface DemoBrand {
  slug: string;
  name: string;
  summary: string;
  state: string;
  categories: string[];
  classification: ManufacturingClassification;
  isSponsored?: boolean;
  priceLevel: 1 | 2 | 3;
}

export interface DemoProduct {
  slug: string;
  name: string;
  brandSlug: string;
  brandName: string;
  category: string;
  summary: string;
  priceDisplay: string;
  classification: ManufacturingClassification;
  isSponsored?: boolean;
}

export interface DemoGuide {
  slug: string;
  title: string;
  excerpt: string;
  isSponsored?: boolean;
}

export const demoCategories: DemoCategory[] = [
  {
    slug: "cookware",
    name: "Cookware",
    description: "Skillets, pots, and bakeware.",
  },
  {
    slug: "kitchen-tools",
    name: "Kitchen Tools",
    description: "Knives, boards, and utensils.",
  },
  {
    slug: "furniture",
    name: "Furniture",
    description: "Tables, seating, and storage.",
  },
  {
    slug: "bedding",
    name: "Bedding",
    description: "Sheets, blankets, and pillows.",
  },
  {
    slug: "home-decor",
    name: "Home Décor",
    description: "Lighting, textiles, and accents.",
  },
  {
    slug: "tools",
    name: "Tools",
    description: "Hand tools and workshop gear.",
  },
  {
    slug: "lawn-garden",
    name: "Lawn & Garden",
    description: "Outdoor and garden equipment.",
  },
  {
    slug: "cleaning",
    name: "Cleaning Products",
    description: "Household cleaning and care.",
  },
];

export const demoBrands: DemoBrand[] = [
  {
    slug: "hearthstead-cookware",
    name: "Hearthstead Cookware (Demo)",
    summary:
      "Fictional cast-iron maker used to demonstrate a verified brand profile.",
    state: "Ohio",
    categories: ["Cookware"],
    classification: "verified_made_in_usa",
    priceLevel: 2,
  },
  {
    slug: "bluegrain-woodworks",
    name: "Bluegrain Woodworks (Demo)",
    summary:
      "Fictional furniture workshop demonstrating a brand-reported claim.",
    state: "North Carolina",
    categories: ["Furniture"],
    classification: "brand_reported_made_in_usa",
    priceLevel: 3,
  },
  {
    slug: "northloom-textiles",
    name: "Northloom Textiles (Demo)",
    summary:
      "Fictional bedding mill demonstrating imported-components disclosure.",
    state: "Maine",
    categories: ["Bedding", "Home Décor"],
    classification: "made_in_usa_imported_components",
    priceLevel: 2,
  },
  {
    slug: "copperfield-tool",
    name: "Copperfield Tool Co. (Demo)",
    summary:
      "Fictional hand-tool maker demonstrating an assembled-in-USA status.",
    state: "Pennsylvania",
    categories: ["Tools"],
    classification: "assembled_in_usa",
    priceLevel: 1,
  },
  {
    slug: "prairie-hearth-home",
    name: "Prairie & Hearth Home (Demo)",
    summary: "Fictional décor brand demonstrating a mixed-sourcing catalog.",
    state: "Minnesota",
    categories: ["Home Décor"],
    classification: "certain_products_made_in_usa",
    isSponsored: true,
    priceLevel: 2,
  },
  {
    slug: "clearwater-supply",
    name: "Clearwater Supply (Demo)",
    summary:
      "Fictional cleaning-products brand demonstrating an awaiting-review status.",
    state: "Oregon",
    categories: ["Cleaning Products"],
    classification: "awaiting_review",
    priceLevel: 1,
  },
];

export const demoProducts: DemoProduct[] = [
  {
    slug: "hearthstead-10in-skillet",
    name: "10″ Cast-Iron Skillet (Demo)",
    brandSlug: "hearthstead-cookware",
    brandName: "Hearthstead Cookware (Demo)",
    category: "Cookware",
    summary: "Fictional skillet demonstrating a verified product page.",
    priceDisplay: "≈ $120",
    classification: "verified_made_in_usa",
  },
  {
    slug: "bluegrain-shaker-table",
    name: "Shaker Dining Table (Demo)",
    brandSlug: "bluegrain-woodworks",
    brandName: "Bluegrain Woodworks (Demo)",
    category: "Furniture",
    summary: "Fictional table demonstrating a brand-reported classification.",
    priceDisplay: "≈ $1,450",
    classification: "brand_reported_made_in_usa",
  },
  {
    slug: "northloom-flannel-sheets",
    name: "Flannel Sheet Set (Demo)",
    brandSlug: "northloom-textiles",
    brandName: "Northloom Textiles (Demo)",
    category: "Bedding",
    summary: "Fictional sheets demonstrating imported-components disclosure.",
    priceDisplay: "≈ $180",
    classification: "made_in_usa_imported_components",
  },
  {
    slug: "copperfield-claw-hammer",
    name: "16 oz Claw Hammer (Demo)",
    brandSlug: "copperfield-tool",
    brandName: "Copperfield Tool Co. (Demo)",
    category: "Tools",
    summary: "Fictional hammer demonstrating an assembled-in-USA status.",
    priceDisplay: "≈ $42",
    classification: "assembled_in_usa",
  },
  {
    slug: "prairie-wool-throw",
    name: "Wool Throw Blanket (Demo)",
    brandSlug: "prairie-hearth-home",
    brandName: "Prairie & Hearth Home (Demo)",
    category: "Home Décor",
    summary: "Fictional throw demonstrating a sponsored product card.",
    priceDisplay: "≈ $95",
    classification: "certain_products_made_in_usa",
    isSponsored: true,
  },
  {
    slug: "clearwater-all-purpose",
    name: "All-Purpose Cleaner (Demo)",
    brandSlug: "clearwater-supply",
    brandName: "Clearwater Supply (Demo)",
    category: "Cleaning Products",
    summary: "Fictional cleaner demonstrating an awaiting-review status.",
    priceDisplay: "≈ $12",
    classification: "awaiting_review",
  },
];

export const demoGuides: DemoGuide[] = [
  {
    slug: "cast-iron-buying-guide",
    title: "Choosing American-Made Cast Iron (Demo Guide)",
    excerpt:
      "A fictional shopping guide demonstrating the editorial layout, comparison table, and disclosure placement.",
  },
  {
    slug: "bedding-guide",
    title: "American-Made Bedding, Explained (Demo Guide)",
    excerpt:
      "A fictional guide demonstrating how sourcing evidence is presented alongside recommendations.",
  },
  {
    slug: "workshop-tools-guide",
    title: "Outfitting a Workshop with U.S.-Made Tools (Demo Guide)",
    excerpt:
      "A fictional guide demonstrating 'best for' designations and price-range presentation.",
    isSponsored: true,
  },
];
